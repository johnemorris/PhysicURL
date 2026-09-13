import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { UrlHealthResult } from '../url-health/index.ts';
import { normalizeResourceStatusMap } from './normalize-status.ts';
import type { ResourceHealthStats, ResourceStatusMap } from './types.ts';
import { applyDiagnosticToResource } from './workflow.ts';

const writeQueues = new Map<string, Promise<void>>();

export function loadResourceStatusFile(file: string): ResourceStatusMap {
  try {
    return normalizeResourceStatusMap(JSON.parse(readFileSync(file, 'utf8')));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return {};
    throw error;
  }
}

export function writeResourceStatusFileAtomic(file: string, statusMap: ResourceStatusMap): void {
  mkdirSync(dirname(file), { recursive: true });
  const temporaryFile = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryFile, `${JSON.stringify(statusMap, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    renameSync(temporaryFile, file);
  } catch (error) {
    try {
      unlinkSync(temporaryFile);
    } catch {
      // The temporary file may not exist if creation itself failed.
    }
    throw error;
  }
}

export async function persistDiagnostics(
  file: string,
  results: UrlHealthResult[],
): Promise<ResourceStatusMap> {
  const priorWrite = writeQueues.get(file) ?? Promise.resolve();
  let resolveResult: (value: ResourceStatusMap) => void;
  let rejectResult: (reason: unknown) => void;
  const resultPromise = new Promise<ResourceStatusMap>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  const nextWrite = priorWrite
    .catch(() => undefined)
    .then(() => {
      const current = loadResourceStatusFile(file);
      for (const result of results) {
        current[result.requestedUrl] = applyDiagnosticToResource(current[result.requestedUrl], result);
      }
      writeResourceStatusFileAtomic(file, current);
      resolveResult(current);
    })
    .catch((error: unknown) => {
      rejectResult(error);
    });

  writeQueues.set(file, nextWrite);
  void nextWrite.finally(() => {
    if (writeQueues.get(file) === nextWrite) writeQueues.delete(file);
  });
  return resultPromise;
}

export function getResourceHealthStats(
  resourceUrls: string[],
  statusMap: ResourceStatusMap,
): ResourceHealthStats {
  const stats: ResourceHealthStats = { active: 0, underReview: 0, confirmedBroken: 0, checked: 0 };
  for (const url of resourceUrls) {
    const record = statusMap[url];
    if (record?.lastCheck) stats.checked += 1;
    if (record?.reviewState === 'under_review') stats.underReview += 1;
    else if (record?.reviewState === 'confirmed_broken') stats.confirmedBroken += 1;
    else stats.active += 1;
  }
  return stats;
}
