import { REDIRECT_STATUSES } from './constants.ts';
import { UrlTargetError, validateUrlTarget } from './ssrf-guard.ts';
import type {
  HostResolver,
  HttpMethod,
  UrlHealthTransport,
  UrlHealthTransportResponse,
  UrlHealthEvidence,
  UrlHealthReason,
  ValidatedUrlTarget,
} from './types.ts';

export class RedirectError extends Error {
  readonly reason: Extract<
    UrlHealthReason,
    'invalid_url' | 'unsafe_url' | 'dns_error' | 'redirect_loop' | 'too_many_redirects'
  >;
  readonly redirectCount: number;
  readonly evidence: UrlHealthEvidence[];
  readonly finalUrl?: string;

  constructor(
    reason: Extract<
      UrlHealthReason,
      'invalid_url' | 'unsafe_url' | 'dns_error' | 'redirect_loop' | 'too_many_redirects'
    >,
    message: string,
    redirectCount: number,
    evidence: UrlHealthEvidence[],
    finalUrl?: string,
  ) {
    super(message);
    this.name = 'RedirectError';
    this.reason = reason;
    this.redirectCount = redirectCount;
    this.evidence = evidence;
    this.finalUrl = finalUrl;
  }
}

export interface RedirectRequestOptions {
  transport: UrlHealthTransport;
  resolve: HostResolver;
  method: HttpMethod;
  timeoutMs: number;
  maxRedirects: number;
  userAgent: string;
}

export interface RedirectResponse {
  response: UrlHealthTransportResponse;
  finalUrl: string;
  redirectCount: number;
  evidence: UrlHealthEvidence[];
}

export async function requestWithSafeRedirects(
  input: string,
  options: RedirectRequestOptions,
): Promise<RedirectResponse> {
  let current = input;
  const visited = new Set<string>();
  const evidence: UrlHealthEvidence[] = [];
  let redirectCount = 0;
  let preparedTarget: ValidatedUrlTarget | undefined;

  while (true) {
    let validated: ValidatedUrlTarget;
    try {
      validated = preparedTarget ?? await validateUrlTarget(current, options.resolve);
      preparedTarget = undefined;
    } catch (error) {
      if (error instanceof UrlTargetError) {
        if (redirectCount > 0) {
          evidence.push({
            type: 'unsafe_redirect',
            message: `Redirect target was rejected before connection: ${error.message}`,
            value: current,
          });
        }
        throw new RedirectError(
          error.reason,
          error.message,
          redirectCount,
          evidence,
          current,
        );
      }
      throw error;
    }

    const normalized = validated.url.href;
    if (visited.has(normalized)) {
      evidence.push({ type: 'redirect_loop', message: 'Redirect revisited an earlier URL', value: normalized });
      throw new RedirectError('redirect_loop', 'Redirect loop detected', redirectCount, evidence, normalized);
    }
    visited.add(normalized);

    const response = await options.transport({
      ...validated,
      method: options.method,
      timeoutMs: options.timeoutMs,
      userAgent: options.userAgent,
    });

    if (!REDIRECT_STATUSES.has(response.status)) {
      return { response, finalUrl: normalized, redirectCount, evidence };
    }

    const location = response.headers.location;
    if (!location) {
      evidence.push({
        type: 'invalid_redirect',
        message: `HTTP ${response.status} response did not include a Location header`,
        value: response.status,
      });
      return { response, finalUrl: normalized, redirectCount, evidence };
    }
    if (redirectCount >= options.maxRedirects) {
      evidence.push({
        type: 'too_many_redirects',
        message: `Redirect limit of ${options.maxRedirects} was exceeded`,
        value: location,
      });
      response.close();
      throw new RedirectError(
        'too_many_redirects',
        'Too many redirects',
        redirectCount,
        evidence,
        normalized,
      );
    }

    let next: URL;
    try {
      next = new URL(location, normalized);
    } catch {
      response.close();
      evidence.push({ type: 'invalid_redirect', message: 'Redirect target is not a valid URL', value: location });
      throw new RedirectError('invalid_url', 'Redirect target is invalid', redirectCount, evidence, normalized);
    }

    response.close();
    try {
      preparedTarget = await validateUrlTarget(next, options.resolve);
    } catch (error) {
      if (error instanceof UrlTargetError) {
        evidence.push({
          type: 'unsafe_redirect',
          message: `Redirect target was rejected: ${error.message}`,
          value: next.href,
        });
        throw new RedirectError(error.reason, error.message, redirectCount + 1, evidence, next.href);
      }
      throw error;
    }

    redirectCount += 1;
    evidence.push({
      type: 'redirect',
      message: `HTTP ${response.status} redirected to ${next.href}`,
      value: response.status,
    });
    if (validated.url.protocol === 'http:' && next.protocol === 'https:') {
      evidence.push({ type: 'protocol_upgrade', message: 'Redirect upgraded HTTP to HTTPS', value: true });
    }
    if (validated.url.hostname.toLowerCase() !== next.hostname.toLowerCase()) {
      evidence.push({
        type: 'host_changed',
        message: `Redirect changed host from ${validated.url.hostname} to ${next.hostname}`,
        value: `${validated.url.hostname}|${next.hostname}`,
      });
    }
    current = next.href;
  }
}
