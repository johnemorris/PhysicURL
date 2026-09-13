export const DEFAULT_TIMEOUT_MS = 8_000;
export const DEFAULT_MAX_REDIRECTS = 6;
export const DEFAULT_MAX_BODY_BYTES = 64 * 1024;
export const DEFAULT_USER_AGENT =
  'URLHealthChecker/1.0 (automated diagnostic link check)';

export const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export const HEAD_CONCLUSIVE_STATUSES = new Set([200, 201, 204]);
