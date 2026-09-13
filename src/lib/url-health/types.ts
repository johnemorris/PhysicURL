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

export interface ValidatedUrlTarget {
  url: URL;
  hostname: string;
  validatedAddresses: ResolvedAddress[];
}

export interface UrlHealthTransportRequest extends ValidatedUrlTarget {
  method: HttpMethod;
  timeoutMs: number;
  userAgent: string;
}

export interface UrlHealthTransportResponse {
  status: number;
  headers: Record<string, string>;
  body?: AsyncIterable<Uint8Array | string>;
  close: () => void;
}

export type UrlHealthTransport = (
  request: UrlHealthTransportRequest,
) => Promise<UrlHealthTransportResponse>;

export interface UrlHealthOptions {
  transport?: UrlHealthTransport;
  resolve?: HostResolver;
  timeoutMs?: number;
  maxRedirects?: number;
  maxBodyBytes?: number;
  userAgent?: string;
  now?: () => Date;
}

export type HttpMethod = 'HEAD' | 'GET';
