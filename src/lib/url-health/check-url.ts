import {
  DEFAULT_MAX_BODY_BYTES,
  DEFAULT_MAX_REDIRECTS,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_USER_AGENT,
  HEAD_CONCLUSIVE_STATUSES,
} from './constants.ts';
import { classifyHttpResponse } from './classify-result.ts';
import { RedirectError, requestWithSafeRedirects, type RedirectResponse } from './redirects.ts';
import { defaultHostResolver, UrlTargetError, validateUrlTarget } from './ssrf-guard.ts';
import type {
  HttpMethod,
  UrlHealthEvidence,
  UrlHealthOptions,
  UrlHealthReason,
  UrlHealthResult,
  UrlHealthStatus,
} from './types.ts';

interface RequestFailure {
  status: UrlHealthStatus;
  reason: UrlHealthReason;
  message: string;
}

function classifyRequestError(error: unknown): RequestFailure {
  if (error instanceof RedirectError) {
    const status = error.reason === 'dns_error' ? 'unreachable' : 'suspicious';
    return { status, reason: error.reason, message: error.message };
  }
  if (error instanceof UrlTargetError) {
    return {
      status: error.reason === 'dns_error' ? 'unreachable' : 'suspicious',
      reason: error.reason,
      message: error.message,
    };
  }

  const record = error && typeof error === 'object' ? error as Record<string, unknown> : {};
  const cause = record.cause && typeof record.cause === 'object'
    ? record.cause as Record<string, unknown>
    : {};
  const name = String(record.name ?? '');
  const code = String(cause.code ?? record.code ?? '');
  const message = error instanceof Error ? error.message : 'Request failed';

  if (name === 'AbortError' || code === 'ABORT_ERR' || /abort|timeout/i.test(message)) {
    return { status: 'unreachable', reason: 'timeout', message };
  }
  if (['ENOTFOUND', 'EAI_AGAIN', 'EAI_FAIL'].includes(code)) {
    return { status: 'unreachable', reason: 'dns_error', message };
  }
  if (/CERT|TLS|SSL|ERR_TLS/i.test(code) || /certificate|tls|ssl/i.test(message)) {
    return { status: 'unreachable', reason: 'tls_error', message };
  }
  return { status: 'unreachable', reason: 'connection_error', message };
}

async function readBodySample(response: Response, maxBodyBytes: number, timeoutMs: number): Promise<{
  sample?: string;
  evidence: UrlHealthEvidence[];
}> {
  if (!response.body) return { evidence: [] };

  const contentType = response.headers.get('content-type') ?? '';
  if (!/text|html|json|xml|javascript/i.test(contentType)) {
    await response.body.cancel();
    return { evidence: [] };
  }

  const reader = response.body.getReader();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void reader.cancel('Body inspection timed out');
  }, timeoutMs);
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  try {
    while (total < maxBodyBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      const remaining = maxBodyBytes - total;
      chunks.push(value.subarray(0, remaining));
      total += Math.min(value.byteLength, remaining);
      if (value.byteLength > remaining || total >= maxBodyBytes) {
        truncated = true;
        break;
      }
    }
  } finally {
    clearTimeout(timer);
    await reader.cancel().catch(() => undefined);
  }
  if (timedOut) throw new DOMException('Response body inspection timed out', 'AbortError');

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return {
    sample: new TextDecoder().decode(body),
    evidence: truncated
      ? [{ type: 'body_truncated', message: 'Response body inspection reached the configured byte limit', value: maxBodyBytes }]
      : [],
  };
}

function buildResult(
  requestedUrl: string,
  startedAt: number,
  checkedAt: string,
  fields: Omit<UrlHealthResult, 'requestedUrl' | 'durationMs' | 'checkedAt'>,
): UrlHealthResult {
  return {
    requestedUrl,
    ...fields,
    durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
    checkedAt,
  };
}

function failureResult(
  requestedUrl: string,
  startedAt: number,
  checkedAt: string,
  error: unknown,
  method?: HttpMethod,
  priorEvidence: UrlHealthEvidence[] = [],
): UrlHealthResult {
  const failure = classifyRequestError(error);
  const redirect = error instanceof RedirectError ? error : undefined;
  return buildResult(requestedUrl, startedAt, checkedAt, {
    finalUrl: redirect?.finalUrl,
    status: failure.status,
    reason: failure.reason,
    redirectCount: redirect?.redirectCount ?? 0,
    evidence: [
      ...priorEvidence,
      ...(redirect?.evidence ?? []),
      {
        type: 'request_error',
        message: `${method ? `${method} request` : 'URL validation'} failed: ${failure.message}`,
        value: failure.reason,
      },
    ],
  });
}

export async function checkUrl(
  requestedUrl: string,
  options: UrlHealthOptions = {},
): Promise<UrlHealthResult> {
  const startedAt = performance.now();
  const checkedAt = (options.now ?? (() => new Date()))().toISOString();
  const fetchImpl = options.fetch ?? fetch;
  const resolve = options.resolve ?? defaultHostResolver;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const evidence: UrlHealthEvidence[] = [];

  try {
    await validateUrlTarget(requestedUrl, resolve);
  } catch (error) {
    return failureResult(requestedUrl, startedAt, checkedAt, error);
  }

  const request = (method: HttpMethod) => requestWithSafeRedirects(requestedUrl, {
    fetch: fetchImpl,
    resolve,
    method,
    timeoutMs,
    maxRedirects,
    userAgent,
  });

  let head: RedirectResponse | undefined;
  try {
    head = await request('HEAD');
    evidence.push(...head.evidence, {
      type: 'request_attempt',
      message: `HEAD completed with HTTP ${head.response.status}`,
      value: head.response.status,
    });
  } catch (error) {
    if (error instanceof RedirectError && [
      'unsafe_url',
      'invalid_url',
      'redirect_loop',
      'too_many_redirects',
    ].includes(error.reason)) {
      return failureResult(requestedUrl, startedAt, checkedAt, error, 'HEAD', evidence);
    }
    const failure = classifyRequestError(error);
    evidence.push({
      type: 'head_fallback',
      message: `HEAD failed (${failure.reason}); attempting GET`,
      value: failure.reason,
    });
  }

  if (head && HEAD_CONCLUSIVE_STATUSES.has(head.response.status)) {
    const classification = classifyHttpResponse({
      httpStatus: head.response.status,
      method: 'HEAD',
      contentType: head.response.headers.get('content-type') ?? undefined,
      redirectCount: head.redirectCount,
    });
    return buildResult(requestedUrl, startedAt, checkedAt, {
      finalUrl: head.finalUrl,
      status: classification.status,
      reason: classification.reason,
      httpStatus: head.response.status,
      redirectCount: head.redirectCount,
      evidence: [...evidence, ...classification.evidence],
    });
  }

  if (head) {
    evidence.push({
      type: 'head_fallback',
      message: `HEAD returned HTTP ${head.response.status}; attempting GET for confirmation`,
      value: head.response.status,
    });
  }

  let get: RedirectResponse;
  try {
    get = await request('GET');
  } catch (error) {
    return failureResult(requestedUrl, startedAt, checkedAt, error, 'GET', evidence);
  }

  evidence.push(...get.evidence, {
    type: 'request_attempt',
    message: `GET completed with HTTP ${get.response.status}`,
    value: get.response.status,
  });
  let body: Awaited<ReturnType<typeof readBodySample>>;
  try {
    body = await readBodySample(get.response, maxBodyBytes, timeoutMs);
  } catch (error) {
    const failure = classifyRequestError(error);
    return buildResult(requestedUrl, startedAt, checkedAt, {
      finalUrl: get.finalUrl,
      status: failure.status,
      reason: failure.reason,
      httpStatus: get.response.status,
      redirectCount: get.redirectCount,
      evidence: [
        ...evidence,
        { type: 'request_error', message: `GET response inspection failed: ${failure.message}`, value: failure.reason },
      ],
    });
  }
  const classification = classifyHttpResponse({
    httpStatus: get.response.status,
    method: 'GET',
    contentType: get.response.headers.get('content-type') ?? undefined,
    bodySample: body.sample,
    redirectCount: get.redirectCount,
  });

  return buildResult(requestedUrl, startedAt, checkedAt, {
    finalUrl: get.finalUrl,
    status: classification.status,
    reason: classification.reason,
    httpStatus: get.response.status,
    redirectCount: get.redirectCount,
    evidence: [...evidence, ...body.evidence, ...classification.evidence],
  });
}
