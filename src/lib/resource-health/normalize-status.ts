import type { UrlHealthEvidence, UrlHealthReason, UrlHealthResult, UrlHealthStatus } from '../url-health/index.ts';
import type {
  LegacyResourceStatus,
  JsonValue,
  ResourceHealthRecord,
  ResourceReviewState,
  ResourceStatusMap,
} from './types.ts';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asJsonValue(value: unknown): JsonValue | undefined {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    const items = value.map(asJsonValue);
    return items.some((item) => item === undefined) ? undefined : items as JsonValue[];
  }
  const record = asRecord(value);
  if (!record) return undefined;
  const entries = Object.entries(record).flatMap(([key, item]) => {
    const normalized = asJsonValue(item);
    return normalized === undefined ? [] : [[key, normalized] as const];
  });
  return Object.fromEntries(entries);
}

function originalLegacyRecord(record: Record<string, unknown>): Record<string, JsonValue> | undefined {
  const excluded = new Set([
    'reviewState',
    'lastCheck',
    'consecutiveFailures',
    'reviewDetails',
    'updatedAt',
    'legacy',
  ]);
  const entries = Object.entries(record).flatMap(([key, value]) => {
    if (excluded.has(key)) return [];
    const normalized = asJsonValue(value);
    return normalized === undefined ? [] : [[key, normalized] as const];
  });
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function normalizeEvidence(value: unknown): UrlHealthEvidence[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const record = asRecord(entry);
    const type = asString(record?.type);
    const message = asString(record?.message);
    if (!type || !message) return [];
    const rawValue = record?.value;
    const evidenceValue = typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean'
      ? rawValue
      : undefined;
    return [{ type, message, ...(evidenceValue !== undefined ? { value: evidenceValue } : {}) }];
  });
}

function normalizeLastCheck(value: unknown, requestedUrl: string): UrlHealthResult | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const status = asString(record.status);
  const reason = asString(record.reason);
  if (!status || !['healthy', 'suspicious', 'unreachable'].includes(status) || !reason) return undefined;

  return {
    requestedUrl: asString(record.requestedUrl) ?? requestedUrl,
    ...(asString(record.finalUrl) ? { finalUrl: asString(record.finalUrl) } : {}),
    status: status as UrlHealthStatus,
    reason: reason as UrlHealthReason,
    ...(asNumber(record.httpStatus) !== undefined ? { httpStatus: asNumber(record.httpStatus) } : {}),
    redirectCount: Math.max(0, asNumber(record.redirectCount) ?? 0),
    durationMs: Math.max(0, asNumber(record.durationMs) ?? 0),
    checkedAt: asString(record.checkedAt) ?? new Date(0).toISOString(),
    evidence: normalizeEvidence(record.evidence),
  };
}

function normalizeReviewState(record: Record<string, unknown>): ResourceReviewState {
  const state = asString(record.reviewState);
  if (state === 'active' || state === 'under_review' || state === 'confirmed_broken') return state;
  if (record.under_review === true) return 'under_review';
  if (record.under_review === false) return 'active';

  // Historically every entry in resource_status.json was hidden by the public UI.
  // Preserve that review decision unless a legacy record explicitly said it was live.
  const legacyStatus = asString(record.status);
  return legacyStatus === 'live' || legacyStatus === 'active' ? 'active' : 'under_review';
}

function legacyReason(status: string | undefined, httpStatus: number | undefined): UrlHealthReason {
  if (status === 'timeout') return 'timeout';
  if (status === 'repurposed') return 'unexpected_response';
  if (status === 'live' || status === 'active') return 'ok';
  return httpStatus !== undefined ? 'http_error' : 'connection_error';
}

function legacyDiagnostic(
  requestedUrl: string,
  legacy: LegacyResourceStatus,
): UrlHealthResult | undefined {
  if (!legacy.status && !legacy.details && !legacy.checked) return undefined;
  const reason = legacyReason(legacy.status, legacy.httpStatus ?? undefined);
  const status: UrlHealthStatus = reason === 'ok'
    ? 'healthy'
    : reason === 'unexpected_response'
      ? 'suspicious'
      : 'unreachable';
  const evidence: UrlHealthEvidence[] = [];
  if (legacy.status) {
    evidence.push({ type: 'legacy_status', message: 'Imported legacy diagnostic status', value: legacy.status });
  }
  if (legacy.details) {
    evidence.push({ type: 'legacy_details', message: legacy.details });
  }
  if (legacy.pageTitle) {
    evidence.push({ type: 'page_title', message: 'Imported legacy page title', value: legacy.pageTitle });
  }
  return {
    requestedUrl,
    status,
    reason,
    ...(legacy.httpStatus !== undefined && legacy.httpStatus !== null
      ? { httpStatus: legacy.httpStatus }
      : {}),
    redirectCount: 0,
    durationMs: 0,
    checkedAt: legacy.checked ?? new Date(0).toISOString(),
    evidence,
  };
}

export function normalizeResourceHealthRecord(
  requestedUrl: string,
  value: unknown,
): ResourceHealthRecord {
  const record = asRecord(value) ?? {};
  const storedLegacy = asRecord(record.legacy) ?? {};
  const storedOriginal = asJsonValue(storedLegacy.original);
  const legacy: LegacyResourceStatus = {
    ...(asString(record.status) || asString(storedLegacy.status)
      ? { status: asString(record.status) ?? asString(storedLegacy.status) }
      : {}),
    ...(asString(record.details) || asString(storedLegacy.details)
      ? { details: asString(record.details) ?? asString(storedLegacy.details) }
      : {}),
    ...(asString(record.checked) || asString(storedLegacy.checked)
      ? { checked: asString(record.checked) ?? asString(storedLegacy.checked) }
      : {}),
    ...(record.http_status === null || asNumber(record.http_status) !== undefined
      ? { httpStatus: record.http_status as number | null }
      : storedLegacy.httpStatus === null || asNumber(storedLegacy.httpStatus) !== undefined
        ? { httpStatus: storedLegacy.httpStatus as number | null }
      : {}),
    ...(asString(record.page_title) || asString(storedLegacy.pageTitle)
      ? { pageTitle: asString(record.page_title) ?? asString(storedLegacy.pageTitle) }
      : {}),
    ...(typeof record.under_review === 'boolean'
      ? { underReview: record.under_review }
      : typeof storedLegacy.underReview === 'boolean'
        ? { underReview: storedLegacy.underReview }
        : {}),
    ...(storedOriginal && !Array.isArray(storedOriginal) && typeof storedOriginal === 'object'
      ? { original: storedOriginal as Record<string, JsonValue> }
      : originalLegacyRecord(record)
        ? { original: originalLegacyRecord(record) }
        : {}),
  };
  const hasLegacy = Object.keys(legacy).length > 0;
  const lastCheck = normalizeLastCheck(record.lastCheck, requestedUrl)
    ?? legacyDiagnostic(requestedUrl, legacy);
  const reviewDetails = asString(record.reviewDetails) ?? legacy.details;

  return {
    reviewState: normalizeReviewState(record),
    ...(lastCheck ? { lastCheck } : {}),
    consecutiveFailures: Math.max(
      0,
      asNumber(record.consecutiveFailures) ?? (lastCheck && lastCheck.status !== 'healthy' ? 1 : 0),
    ),
    ...(reviewDetails ? { reviewDetails } : {}),
    ...(asString(record.updatedAt) || lastCheck?.checkedAt
      ? { updatedAt: asString(record.updatedAt) ?? lastCheck?.checkedAt }
      : {}),
    ...(hasLegacy ? { legacy } : {}),
  };
}

export function normalizeResourceStatusMap(value: unknown): ResourceStatusMap {
  const raw = asRecord(value);
  if (!raw) return {};
  return Object.fromEntries(
    Object.entries(raw).map(([url, record]) => [url, normalizeResourceHealthRecord(url, record)]),
  );
}

export function isUnderReview(record: ResourceHealthRecord | undefined): boolean {
  return record?.reviewState === 'under_review';
}

export function reviewDetails(record: ResourceHealthRecord | undefined): string {
  return record?.reviewDetails
    ?? record?.lastCheck?.evidence.find((entry) => entry.type === 'legacy_details')?.message
    ?? 'Under review';
}
