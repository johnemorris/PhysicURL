import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { UrlHealthResult } from '../../url-health/index.ts';
import { checkResources } from '../check-resources.ts';
import { normalizeResourceStatusMap } from '../normalize-status.ts';
import { getResourceHealthStats, persistDiagnostics } from '../status-store.ts';
import { applyDiagnosticToResource } from '../workflow.ts';

function diagnostic(overrides: Partial<UrlHealthResult> = {}): UrlHealthResult {
  return {
    requestedUrl: 'https://example.com/',
    finalUrl: 'https://example.com/',
    status: 'healthy',
    reason: 'ok',
    httpStatus: 200,
    redirectCount: 0,
    durationMs: 12,
    checkedAt: '2026-09-12T12:00:00.000Z',
    evidence: [],
    ...overrides,
  };
}

test('a healthy resource remains active', () => {
  const record = applyDiagnosticToResource(undefined, diagnostic());
  assert.equal(record.reviewState, 'active');
  assert.equal(record.consecutiveServerFailures, 0);
});

test('same-service redirects remain active while cross-domain redirects enter review', () => {
  const sameService = applyDiagnosticToResource(undefined, diagnostic({
    requestedUrl: 'http://example.com/docs',
    finalUrl: 'https://www.example.com/docs/',
    reason: 'redirected',
    redirectCount: 2,
  }));
  const differentService = applyDiagnosticToResource(undefined, diagnostic({
    requestedUrl: 'https://example.com/docs',
    finalUrl: 'https://unrelated.example.net/docs',
    reason: 'redirected',
    redirectCount: 1,
    evidence: [{ type: 'host_changed', message: 'Host changed', value: 'example.com|unrelated.example.net' }],
  }));
  assert.equal(sameService.reviewState, 'active');
  assert.equal(differentService.reviewState, 'under_review');
  assert.notEqual(differentService.reviewState, 'confirmed_broken');
});

test('a strong suspicious result moves an active resource under review', () => {
  const record = applyDiagnosticToResource(undefined, diagnostic({
    status: 'suspicious',
    reason: 'http_error',
    httpStatus: 404,
  }));
  assert.equal(record.reviewState, 'under_review');
});

test('temporary 5xx responses require repetition before review', () => {
  const first = applyDiagnosticToResource(undefined, diagnostic({
    status: 'unreachable', reason: 'http_error', httpStatus: 503,
  }));
  const second = applyDiagnosticToResource(first, diagnostic({
    status: 'unreachable', reason: 'http_error', httpStatus: 503,
  }));
  assert.equal(first.reviewState, 'active');
  assert.equal(second.reviewState, 'under_review');
  assert.equal(first.consecutiveServerFailures, 1);
  assert.equal(second.consecutiveServerFailures, 2);
});

test('access blocks do not pollute the review queue', () => {
  const record = applyDiagnosticToResource(undefined, diagnostic({
    status: 'suspicious', reason: 'blocked', httpStatus: 403,
  }));
  assert.equal(record.reviewState, 'active');
});

test('only consecutive temporary server failures increment the server-failure counter', () => {
  const notFound = applyDiagnosticToResource(undefined, diagnostic({
    status: 'suspicious', reason: 'http_error', httpStatus: 404,
  }));
  const timeout = applyDiagnosticToResource(undefined, diagnostic({
    status: 'unreachable', reason: 'timeout', httpStatus: undefined,
  }));
  const serverFailure = applyDiagnosticToResource(undefined, diagnostic({
    status: 'unreachable', reason: 'http_error', httpStatus: 502,
  }));
  const resetByDifferentConcern = applyDiagnosticToResource(serverFailure, diagnostic({
    status: 'unreachable', reason: 'timeout', httpStatus: undefined,
  }));
  assert.equal(notFound.consecutiveServerFailures, 0);
  assert.equal(timeout.consecutiveServerFailures, 0);
  assert.equal(serverFailure.consecutiveServerFailures, 1);
  assert.equal(resetByDifferentConcern.consecutiveServerFailures, 0);
});

test('automated checks never set confirmed broken', () => {
  const record = applyDiagnosticToResource(undefined, diagnostic({
    status: 'unreachable', reason: 'dns_error', httpStatus: undefined,
  }));
  assert.notEqual(record.reviewState, 'confirmed_broken');
  assert.equal(record.reviewState, 'under_review');
});

test('existing under review state remains after another concern', () => {
  const record = applyDiagnosticToResource({
    reviewState: 'under_review',
    consecutiveServerFailures: 0,
    reviewConcern: {
      reason: 'http_error',
      observedAt: '2026-09-10T12:00:00.000Z',
      summary: 'HTTP 404 observed',
      httpStatus: 404,
    },
  }, diagnostic({ status: 'unreachable', reason: 'timeout', httpStatus: undefined }));
  assert.equal(record.reviewState, 'under_review');
  assert.equal(record.reviewConcern?.summary, 'HTTP 404 observed');
  assert.equal(record.reviewConcern?.observedAt, '2026-09-10T12:00:00.000Z');
});

test('recovery is recorded but intentionally requires explicit review to reactivate', () => {
  const record = applyDiagnosticToResource({
    reviewState: 'under_review',
    consecutiveServerFailures: 0,
    reviewConcern: {
      reason: 'http_error',
      observedAt: '2026-09-10T12:00:00.000Z',
      summary: 'HTTP 404 observed',
      httpStatus: 404,
    },
  }, diagnostic());
  assert.equal(record.reviewState, 'under_review');
  assert.equal(record.lastCheck?.status, 'healthy');
  assert.equal(record.consecutiveServerFailures, 0);
  assert.equal(record.reviewConcern?.httpStatus, 404);
});

test('a new review cycle replaces historical concern metadata after manual reactivation', () => {
  const record = applyDiagnosticToResource({
    reviewState: 'active',
    consecutiveServerFailures: 0,
    reviewConcern: {
      reason: 'http_error',
      observedAt: '2026-09-01T12:00:00.000Z',
      summary: 'Previous HTTP 404',
      httpStatus: 404,
    },
  }, diagnostic({
    status: 'unreachable',
    reason: 'dns_error',
    httpStatus: undefined,
    checkedAt: '2026-09-13T12:00:00.000Z',
  }));
  assert.equal(record.reviewState, 'under_review');
  assert.equal(record.reviewConcern?.reason, 'dns_error');
  assert.equal(record.reviewConcern?.observedAt, '2026-09-13T12:00:00.000Z');
});

test('confirmed broken state survives automation unchanged', () => {
  const record = applyDiagnosticToResource({
    reviewState: 'confirmed_broken',
    consecutiveServerFailures: 0,
  }, diagnostic());
  assert.equal(record.reviewState, 'confirmed_broken');
});

test('legacy records normalize without losing their review history', () => {
  const statusMap = normalizeResourceStatusMap({
    'https://dead.example/': {
      status: 'dead',
      details: 'HTTP 404 — page not found',
      checked: '2026-09-11T04:14:45.271636+00:00',
      http_status: 404,
      page_title: 'Missing',
      historical_note: 'Keep this field',
    },
    'https://timeout.example/': { status: 'timeout', details: 'Request timed out' },
    'https://repurposed.example/': { status: 'repurposed', details: 'Content changed' },
  });
  assert.equal(statusMap['https://dead.example/'].reviewState, 'under_review');
  assert.equal(statusMap['https://dead.example/'].lastCheck?.httpStatus, 404);
  assert.equal(statusMap['https://dead.example/'].reviewConcern?.httpStatus, 404);
  assert.equal(statusMap['https://dead.example/'].reviewConcern?.observedAt, '2026-09-11T04:14:45.271636+00:00');
  assert.equal(statusMap['https://dead.example/'].legacy?.pageTitle, 'Missing');
  assert.equal(statusMap['https://dead.example/'].legacy?.original?.historical_note, 'Keep this field');
  assert.equal(statusMap['https://timeout.example/'].lastCheck?.reason, 'timeout');
  assert.equal(statusMap['https://repurposed.example/'].lastCheck?.reason, 'unexpected_response');
});

test('the previous status schema normalizes into concern history without treating all concerns as server failures', () => {
  const statusMap = normalizeResourceStatusMap({
    'https://recovered.example/': {
      reviewState: 'under_review',
      reviewDetails: 'Automated check: http error (HTTP 404)',
      consecutiveFailures: 3,
      updatedAt: '2026-09-13T12:00:00.000Z',
      lastCheck: diagnostic({ requestedUrl: 'https://recovered.example/' }),
    },
  });
  const record = statusMap['https://recovered.example/'];
  assert.equal(record.reviewState, 'under_review');
  assert.equal(record.reviewConcern?.summary, 'Automated check: http error (HTTP 404)');
  assert.equal(record.lastCheck?.status, 'healthy');
  assert.equal(record.consecutiveServerFailures, 0);
});

test('a resource check run persists results and returns workflow state immediately', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'physicurl-health-run-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, 'resource_status.json');
  writeFileSync(file, JSON.stringify({
    'https://legacy.example/': {
      status: 'dead',
      details: 'Legacy review decision',
      audit_reference: 'old-run-17',
    },
  }));

  const byUrl: Record<string, UrlHealthResult> = {
    'https://healthy.example/': diagnostic({ requestedUrl: 'https://healthy.example/' }),
    'https://missing.example/': diagnostic({
      requestedUrl: 'https://missing.example/',
      status: 'suspicious',
      reason: 'http_error',
      httpStatus: 404,
    }),
  };
  const run = await checkResources([
    { url: 'https://healthy.example/' },
    { url: 'https://missing.example/' },
  ], {
    statusFile: file,
    check: async (url) => byUrl[url],
    log: () => undefined,
  });

  assert.deepEqual(run.summary, { healthy: 1, suspicious: 1, unreachable: 0, underReview: 1 });
  assert.equal(run.results[1].reviewState, 'under_review');
  assert.equal(run.results[1].reviewConcern?.httpStatus, 404);
  const stored = JSON.parse(readFileSync(file, 'utf8')) as Record<string, {
    reviewState: string;
    legacy?: { original?: Record<string, string> };
  }>;
  assert.equal(stored['https://healthy.example/'].reviewState, 'active');
  assert.equal(stored['https://missing.example/'].reviewState, 'under_review');
  assert.equal(stored['https://legacy.example/'].reviewState, 'under_review');
  assert.equal(stored['https://legacy.example/'].legacy?.original?.audit_reference, 'old-run-17');
});

test('health stats use the same normalized review state as public pages', () => {
  const statusMap = normalizeResourceStatusMap({
    'https://review.example/': { status: 'dead', details: 'legacy concern' },
    'https://broken.example/': { reviewState: 'confirmed_broken', consecutiveFailures: 2 },
    'https://active.example/': { reviewState: 'active', consecutiveFailures: 0, lastCheck: diagnostic() },
  });
  const stats = getResourceHealthStats([
    'https://review.example/',
    'https://broken.example/',
    'https://active.example/',
    'https://unchecked.example/',
  ], statusMap);
  assert.deepEqual(stats, { active: 2, underReview: 1, confirmedBroken: 1, checked: 2 });
});

test('concurrent persistence updates are serialized and atomically retained', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'physicurl-health-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, 'resource_status.json');
  writeFileSync(file, '{}\n');

  await Promise.all([
    persistDiagnostics(file, [diagnostic({ requestedUrl: 'https://one.example/' })]),
    persistDiagnostics(file, [diagnostic({
      requestedUrl: 'https://two.example/', status: 'suspicious', reason: 'http_error', httpStatus: 404,
    })]),
  ]);

  const stored = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  assert.deepEqual(Object.keys(stored).sort(), ['https://one.example/', 'https://two.example/']);
  assert.equal((stored['https://two.example/'] as { reviewState: string }).reviewState, 'under_review');
});
