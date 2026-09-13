export { checkUrl } from './check-url.ts';
export { classifyHttpResponse } from './classify-result.ts';
export { isUnsafeIpAddress, parseHttpUrl, validateUrlTarget } from './ssrf-guard.ts';
export type {
  HostResolver,
  ResolvedAddress,
  UrlHealthEvidence,
  UrlHealthFetch,
  UrlHealthOptions,
  UrlHealthReason,
  UrlHealthResult,
  UrlHealthStatus,
} from './types.ts';
