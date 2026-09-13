import { checkUrl, type UrlHealthResult } from '../url-health/index.ts';
import { persistDiagnostics } from './status-store.ts';
import type { ResourceStatusMap } from './types.ts';

interface CheckableResource {
  url: string;
}

export interface ResourceCheckSummary {
  healthy: number;
  suspicious: number;
  unreachable: number;
  underReview: number;
}

export interface CheckedResourceResult extends UrlHealthResult {
  reviewState: 'active' | 'under_review' | 'confirmed_broken';
}

export interface ResourceCheckRun {
  results: CheckedResourceResult[];
  statusMap: ResourceStatusMap;
  summary: ResourceCheckSummary;
}

export interface ResourceCheckOptions {
  statusFile: string;
  limit?: number;
  concurrency?: number;
  check?: (url: string) => Promise<UrlHealthResult>;
  log?: (message: string) => void;
}

async function mapConcurrent<T, R>(
  values: T[],
  concurrency: number,
  task: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(values[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return results;
}

function urlForLog(input: string): string {
  try {
    const url = new URL(input);
    if (url.search) url.search = '?[redacted]';
    url.hash = '';
    return url.href;
  } catch {
    return '[invalid-url]';
  }
}

export async function checkResources(
  resources: CheckableResource[],
  options: ResourceCheckOptions,
): Promise<ResourceCheckRun> {
  const limit = Math.max(0, Math.min(options.limit ?? resources.length, resources.length));
  const urls = [...new Set(resources.slice(0, limit).map(({ url }) => url))];
  const runCheck = options.check ?? checkUrl;
  const log = options.log ?? console.info;
  const diagnostics = await mapConcurrent(
    urls,
    Math.max(1, Math.min(options.concurrency ?? 5, 10)),
    async (url) => {
      const result = await runCheck(url);
      log([
        '[url-health]',
        `url=${JSON.stringify(urlForLog(url))}`,
        `status=${result.status}`,
        `reason=${result.reason}`,
        `http=${result.httpStatus ?? 'none'}`,
        `duration_ms=${result.durationMs}`,
        `redirects=${result.redirectCount}`,
      ].join(' '));
      return result;
    },
  );
  const statusMap = await persistDiagnostics(options.statusFile, diagnostics);
  const results = diagnostics.map((result): CheckedResourceResult => ({
    ...result,
    reviewState: statusMap[result.requestedUrl]?.reviewState ?? 'active',
  }));
  const summary = results.reduce<ResourceCheckSummary>((counts, result) => {
    counts[result.status] += 1;
    if (result.reviewState === 'under_review') counts.underReview += 1;
    return counts;
  }, { healthy: 0, suspicious: 0, unreachable: 0, underReview: 0 });

  return { results, statusMap, summary };
}
