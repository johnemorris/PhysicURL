import type { UrlHealthResult } from '../url-health/index.ts';
import type { ResourceHealthRecord } from './types.ts';

const IMMEDIATE_REVIEW_REASONS = new Set([
  'invalid_url',
  'unsafe_url',
  'timeout',
  'dns_error',
  'connection_error',
  'tls_error',
  'redirect_loop',
  'too_many_redirects',
]);

function isStrongHttpFailure(result: UrlHealthResult): boolean {
  return result.reason === 'http_error' && (result.httpStatus === 404 || result.httpStatus === 410);
}

function isTemporaryServerFailure(result: UrlHealthResult): boolean {
  return result.reason === 'http_error' && result.httpStatus !== undefined && result.httpStatus >= 500;
}

function isSubdomainOrSameHost(first: string, second: string): boolean {
  const normalizedFirst = first.toLowerCase().replace(/^www\./, '');
  const normalizedSecond = second.toLowerCase().replace(/^www\./, '');
  return (
    normalizedFirst === normalizedSecond ||
    normalizedFirst.endsWith(`.${normalizedSecond}`) ||
    normalizedSecond.endsWith(`.${normalizedFirst}`)
  );
}

function hasSubstantialHostChange(result: UrlHealthResult): boolean {
  if (!result.finalUrl || result.redirectCount === 0) return false;
  try {
    const requestedHost = new URL(result.requestedUrl).hostname;
    const finalHost = new URL(result.finalUrl).hostname;
    return !isSubdomainOrSameHost(requestedHost, finalHost);
  } catch {
    return false;
  }
}

function isUnusableResponse(result: UrlHealthResult): boolean {
  if (result.reason !== 'unexpected_response') return false;
  if (result.httpStatus === 202 || result.httpStatus === 405) return false;
  return result.evidence.some((entry) =>
    entry.type === 'content_signal' || entry.type === 'invalid_redirect' || entry.type === 'content_type',
  );
}

export function diagnosticWarrantsReview(
  result: UrlHealthResult,
  priorConsecutiveFailures = 0,
): boolean {
  // A cross-domain redirect is an investigation signal, not a determination
  // that content was repurposed. Canonical/subdomain redirects remain active.
  if (hasSubstantialHostChange(result)) return true;
  if (result.status === 'healthy' || result.reason === 'blocked') return false;
  if (IMMEDIATE_REVIEW_REASONS.has(result.reason)) return true;
  if (isStrongHttpFailure(result) || isUnusableResponse(result)) return true;
  if (isTemporaryServerFailure(result)) return priorConsecutiveFailures + 1 >= 2;
  return false;
}

function summarizeDiagnostic(result: UrlHealthResult): string {
  if (result.httpStatus !== undefined) {
    return `Automated check: ${result.reason.replaceAll('_', ' ')} (HTTP ${result.httpStatus})`;
  }
  return `Automated check: ${result.reason.replaceAll('_', ' ')}`;
}

export function applyDiagnosticToResource(
  previous: ResourceHealthRecord | undefined,
  result: UrlHealthResult,
): ResourceHealthRecord {
  const priorFailures = previous?.consecutiveFailures ?? 0;
  const consecutiveFailures = result.status === 'healthy' || result.reason === 'blocked'
    ? 0
    : priorFailures + 1;
  const warrantsReview = diagnosticWarrantsReview(result, priorFailures);

  // Automation can raise a concern, but only an explicit human workflow may
  // clear review or assign confirmed_broken.
  const reviewState = previous?.reviewState === 'confirmed_broken'
    ? 'confirmed_broken'
    : previous?.reviewState === 'under_review' || warrantsReview
      ? 'under_review'
      : 'active';

  return {
    reviewState,
    lastCheck: result,
    consecutiveFailures,
    ...(reviewState === 'under_review'
      ? { reviewDetails: previous?.reviewDetails ?? summarizeDiagnostic(result) }
      : previous?.reviewDetails
        ? { reviewDetails: previous.reviewDetails }
        : {}),
    updatedAt: result.checkedAt,
    ...(previous?.legacy ? { legacy: previous.legacy } : {}),
  };
}
