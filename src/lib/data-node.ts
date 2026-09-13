/**
 * data-node.ts — Node.js server-side data loaders.
 *
 * Only import this file from Astro page frontmatter (build-time / server
 * context).  Never import it from React components or any client-side code —
 * the `fs` / `path` imports will fail at bundle time.
 *
 * All pure helpers (normalizeResource, buildTree, slugify, SCIENCES, …) live
 * in data.ts and are re-exported here for convenience so server-side pages
 * only need one import.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { Resource, SEOContent, Submission } from './types';
import type { ResourceStatusMap } from './resource-health';
import { normalizeResource } from './data';
import { normalizeResourceStatusMap } from './resource-health';

// Re-export everything from data.ts so callers only need to import from here.
export {
  SCIENCES,
  RESOURCE_TYPE_LABELS,
  ACCESS_LABELS,
  normalizeResource,
  slugify,
  groupByScience,
  groupByScienceSub,
  buildTree,
} from './data';

const DATA_DIR = join(process.cwd(), 'data');

export function loadResources(): Resource[] {
  const raw = readFileSync(join(DATA_DIR, 'resources.json'), 'utf-8');
  const data = JSON.parse(raw);
  return data.map(normalizeResource);
}

export function loadSubmissions(): Submission[] {
  try {
    const raw = readFileSync(join(DATA_DIR, 'submissions.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function loadSEOContent(): Record<string, SEOContent> {
  try {
    const raw = readFileSync(join(DATA_DIR, 'seo_content.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function loadStatusMap(): ResourceStatusMap {
  try {
    const raw = readFileSync(join(DATA_DIR, 'resource_status.json'), 'utf-8');
    return normalizeResourceStatusMap(JSON.parse(raw));
  } catch {
    return {};
  }
}
