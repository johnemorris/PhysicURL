export type UrlHealthStatus = 'healthy' | 'suspicious' | 'unreachable';

export type UrlHealthReason =
  | 'ok'
  | 'redirected'
  | 'http_error'
  | 'timeout'
  | 'dns_error'
  | 'connection_error'
  | 'tls_error'
  | 'blocked'
  | 'invalid_url'
  | 'unsafe_url'
  | 'redirect_loop'
  | 'too_many_redirects'
  | 'unexpected_response';

export interface UrlHealthEvidence {
  type: string;
  message: string;
  value?: string | number | boolean;
}

export interface UrlHealthResult {
  requestedUrl: string;
  finalUrl?: string;
  status: UrlHealthStatus;
  reason: UrlHealthReason;
  httpStatus?: number;
  redirectCount: number;
  durationMs: number;
  checkedAt: string;
  evidence: UrlHealthEvidence[];
}

export interface ResolvedAddress {
  address: string;
  family: 4 | 6;
}

export type HostResolver = (hostname: string) => Promise<ResolvedAddress[]>;

export type UrlHealthFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface UrlHealthOptions {
  fetch?: UrlHealthFetch;
  resolve?: HostResolver;
  timeoutMs?: number;
  maxRedirects?: number;
  maxBodyBytes?: number;
  userAgent?: string;
  now?: () => Date;
}

export type HttpMethod = 'HEAD' | 'GET';
