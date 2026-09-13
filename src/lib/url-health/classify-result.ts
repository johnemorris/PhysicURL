import type { HttpMethod, UrlHealthEvidence, UrlHealthReason, UrlHealthStatus } from './types.ts';

export interface HttpClassificationInput {
  httpStatus: number;
  method: HttpMethod;
  contentType?: string;
  bodySample?: string;
  redirectCount: number;
}

export interface HttpClassification {
  status: UrlHealthStatus;
  reason: UrlHealthReason;
  evidence: UrlHealthEvidence[];
}

const CHALLENGE_SIGNALS = [
  'cf-chl-',
  'cloudflare challenge',
  'client challenge',
  'just a moment...',
  'captcha',
  'verify you are human',
  'access denied',
];

const UNUSABLE_CONTENT_SIGNALS = [
  'account suspended',
  'domain is for sale',
  'buy this domain',
  'parked domain',
  'website has been suspended',
];

function contentSignal(bodySample: string | undefined, signals: string[]): string | undefined {
  if (!bodySample) return undefined;
  const lower = bodySample.toLowerCase();
  return signals.find((signal) => lower.includes(signal));
}

function isUsefulContentType(contentType: string | undefined): boolean {
  if (!contentType) return true;
  const type = contentType.toLowerCase().split(';', 1)[0].trim();
  return (
    type.startsWith('text/') ||
    type.startsWith('image/') ||
    type.startsWith('audio/') ||
    type.startsWith('video/') ||
    type === 'application/pdf' ||
    type === 'application/json' ||
    type === 'application/xml' ||
    type === 'application/xhtml+xml' ||
    type === 'application/octet-stream' ||
    type === 'application/zip' ||
    type.includes('officedocument') ||
    type.includes('opendocument')
  );
}

export function classifyHttpResponse(input: HttpClassificationInput): HttpClassification {
  const evidence: UrlHealthEvidence[] = [{
    type: 'http_status',
    message: `${input.method} returned HTTP ${input.httpStatus}`,
    value: input.httpStatus,
  }];

  if (input.httpStatus >= 200 && input.httpStatus < 300) {
    if (input.httpStatus === 202) {
      evidence.push({
        type: 'inconclusive_status',
        message: 'HTTP 202 acknowledges a request but does not confirm usable content',
        value: 202,
      });
      return { status: 'suspicious', reason: 'unexpected_response', evidence };
    }

    const challenge = contentSignal(input.bodySample, CHALLENGE_SIGNALS);
    if (challenge) {
      evidence.push({ type: 'content_signal', message: 'Response resembles a bot or access challenge', value: challenge });
      return { status: 'suspicious', reason: 'blocked', evidence };
    }

    const unusable = contentSignal(input.bodySample, UNUSABLE_CONTENT_SIGNALS);
    if (unusable) {
      evidence.push({ type: 'content_signal', message: 'Response contains an unusable-site signal', value: unusable });
      return { status: 'suspicious', reason: 'unexpected_response', evidence };
    }

    if (!isUsefulContentType(input.contentType)) {
      evidence.push({
        type: 'content_type',
        message: 'Response used an unexpected content type',
        value: input.contentType,
      });
      return { status: 'suspicious', reason: 'unexpected_response', evidence };
    }

    return {
      status: 'healthy',
      reason: input.redirectCount > 0 ? 'redirected' : 'ok',
      evidence,
    };
  }

  if (input.httpStatus === 401 || input.httpStatus === 403 || input.httpStatus === 429) {
    evidence.push({
      type: 'access_restriction',
      message: 'The server may require authentication, rate-limit checks, or block automated clients',
      value: input.httpStatus,
    });
    return { status: 'suspicious', reason: 'blocked', evidence };
  }

  if (input.httpStatus >= 500) {
    return { status: 'unreachable', reason: 'http_error', evidence };
  }

  if (input.httpStatus === 405) {
    return { status: 'suspicious', reason: 'unexpected_response', evidence };
  }

  return { status: 'suspicious', reason: 'http_error', evidence };
}
