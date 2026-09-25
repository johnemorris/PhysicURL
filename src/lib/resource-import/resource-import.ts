import { randomUUID } from 'node:crypto';
import { ACCESS_LABELS, RESOURCE_TYPE_LABELS, SCIENCES } from '../data.ts';
import { isAmazonUrl } from '../referral.ts';
import type {
  ResourceImportCandidate,
  ResourceImportIssue,
  ResourceImportPreview,
  ResourceTaxonomy,
  StoredResource,
} from './types.ts';

export class ResourceImportInputError extends Error {
  readonly code: 'malformed_json' | 'not_array' | 'empty_batch';

  constructor(
    code: 'malformed_json' | 'not_array' | 'empty_batch',
    message: string,
  ) {
    super(message);
    this.name = 'ResourceImportInputError';
    this.code = code;
  }
}

export class ResourceImportValidationError extends Error {
  readonly preview: ResourceImportPreview;

  constructor(preview: ResourceImportPreview) {
    super('Import contains invalid or duplicate rows');
    this.name = 'ResourceImportValidationError';
    this.preview = preview;
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function limitedString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizeUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    url.hash = '';
    return url;
  } catch {
    return undefined;
  }
}

function duplicateKey(value: string): string {
  const url = normalizeUrl(value);
  if (!url) return value;
  if (url.pathname === '/') url.pathname = '';
  return url.href;
}

function existingValue(resource: Record<string, unknown>, canonical: string, legacy?: string): string | undefined {
  return stringValue(resource[canonical]) ?? (legacy ? stringValue(resource[legacy]) : undefined);
}

export function createResourceTaxonomy(existingResources: readonly unknown[]): ResourceTaxonomy {
  const sciences = new Map<string, string>();
  for (const science of SCIENCES) {
    sciences.set(science.slug.toLowerCase(), science.slug);
    sciences.set(science.name.toLowerCase(), science.slug);
  }

  const subdisciplines = new Map<string, Map<string, string>>();
  const access = new Set(Object.keys(ACCESS_LABELS));
  const resourceTypes = new Set(Object.keys(RESOURCE_TYPE_LABELS));
  for (const value of existingResources) {
    const resource = asRecord(value);
    if (!resource) continue;
    const rawScience = existingValue(resource, 'science');
    const science = rawScience ? sciences.get(rawScience.toLowerCase()) ?? rawScience : undefined;
    const subdiscipline = existingValue(resource, 'subdiscipline');
    const accessValue = existingValue(resource, 'access');
    const resourceType = existingValue(resource, 'resourceType', 'resource_type');
    if (science && subdiscipline) {
      const entries = subdisciplines.get(science) ?? new Map<string, string>();
      entries.set(subdiscipline.toLowerCase(), subdiscipline);
      subdisciplines.set(science, entries);
    }
    if (accessValue) access.add(accessValue);
    if (resourceType) resourceTypes.add(resourceType);
  }
  return { sciences, subdisciplines, access, resourceTypes };
}

export function parseResourceImportJson(raw: string): unknown[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ResourceImportInputError('malformed_json', 'The file is not valid JSON.');
  }
  if (!Array.isArray(parsed)) {
    throw new ResourceImportInputError('not_array', 'The top-level JSON value must be an array of resources.');
  }
  if (parsed.length === 0) {
    throw new ResourceImportInputError('empty_batch', 'The resource array is empty.');
  }
  return parsed;
}

function validateRow(
  value: unknown,
  row: number,
  taxonomy: ResourceTaxonomy,
  existingUrls: Set<string>,
  uploadUrls: Map<string, number>,
): { item?: ResourceImportCandidate; issues: ResourceImportIssue[] } {
  const record = asRecord(value);
  if (!record) {
    return { issues: [{ field: '$', code: 'invalid', message: `Row ${row} must be a JSON object.` }] };
  }

  const issues: ResourceImportIssue[] = [];
  const title = stringValue(record.title) ?? stringValue(record.name);
  const rawUrl = stringValue(record.url);
  const rawScience = stringValue(record.science);
  const rawSubdiscipline = stringValue(record.subdiscipline);
  if (!title) issues.push({ field: 'title', code: 'required', message: 'title (or name) is required.' });
  if (!rawUrl) issues.push({ field: 'url', code: 'required', message: 'url is required.' });
  if (!rawScience) issues.push({ field: 'science', code: 'required', message: 'science is required.' });
  if (!rawSubdiscipline) issues.push({ field: 'subdiscipline', code: 'required', message: 'subdiscipline is required.' });

  const url = rawUrl ? normalizeUrl(rawUrl) : undefined;
  if (rawUrl && !url) {
    issues.push({ field: 'url', code: 'invalid', message: 'url must be an HTTP(S) URL without embedded credentials.' });
  }

  const science = rawScience ? taxonomy.sciences.get(rawScience.toLowerCase()) : undefined;
  if (rawScience && !science) {
    issues.push({ field: 'science', code: 'unknown_taxonomy', message: `Unknown science: ${rawScience}.` });
  }
  const subdiscipline = science && rawSubdiscipline
    ? taxonomy.subdisciplines.get(science)?.get(rawSubdiscipline.toLowerCase())
    : undefined;
  if (science && rawSubdiscipline && !subdiscipline) {
    issues.push({ field: 'subdiscipline', code: 'unknown_taxonomy', message: `Unknown ${science} subdiscipline: ${rawSubdiscipline}.` });
  }

  const access = stringValue(record.access) ?? 'free';
  if (!taxonomy.access.has(access)) {
    issues.push({ field: 'access', code: 'unknown_taxonomy', message: `Unknown access type: ${access}.` });
  }
  const resourceType = stringValue(record.resourceType) ?? stringValue(record.resource_type) ?? 'reference';
  if (!taxonomy.resourceTypes.has(resourceType)) {
    issues.push({ field: 'resourceType', code: 'unknown_taxonomy', message: `Unknown resource type: ${resourceType}.` });
  }

  const ratingValue = record.rating;
  const rating = ratingValue === undefined || ratingValue === null || ratingValue === '' ? null : Number(ratingValue);
  if (rating !== null && (!Number.isFinite(rating) || rating < 0 || rating > 5)) {
    issues.push({ field: 'rating', code: 'invalid', message: 'rating must be a number from 0 to 5.' });
  }
  if (record.tags !== undefined && !Array.isArray(record.tags)) {
    issues.push({ field: 'tags', code: 'invalid', message: 'tags must be an array of strings.' });
  }
  const tags = Array.isArray(record.tags)
    ? record.tags.filter((tag): tag is string => typeof tag === 'string').map(tag => tag.trim()).filter(Boolean).slice(0, 25)
    : [];
  if (Array.isArray(record.tags) && tags.length !== record.tags.length) {
    issues.push({ field: 'tags', code: 'invalid', message: 'every tag must be a non-empty string.' });
  }

  if (url) {
    const key = duplicateKey(url.href);
    if (existingUrls.has(key)) {
      issues.push({ field: 'url', code: 'duplicate_existing', message: 'This URL already exists in the directory.' });
    }
    const firstRow = uploadUrls.get(key);
    if (firstRow !== undefined) {
      issues.push({ field: 'url', code: 'duplicate_upload', message: `This URL duplicates row ${firstRow}.` });
    } else {
      uploadUrls.set(key, row);
    }
  }

  if (issues.length > 0 || !title || !url || !science || !subdiscipline) return { issues };
  const rawEstablished = record.yearEstablished;
  const established = typeof rawEstablished === 'number' && Number.isInteger(rawEstablished)
    ? rawEstablished
    : stringValue(rawEstablished);
  if (established !== undefined && !/^\d{4}$/.test(String(established))) {
    issues.push({ field: 'yearEstablished', code: 'invalid', message: 'yearEstablished must be a four-digit year.' });
    return { issues };
  }
  return {
    issues,
    item: {
      title: title.slice(0, 200),
      url: url.href,
      domain: url.hostname.toLowerCase(),
      description: limitedString(record.description, 1_000),
      science,
      subdiscipline,
      resourceType,
      access,
      rating,
      yearEstablished: established !== undefined ? Number(established) : '',
      tags,
      isVerified: false,
      isCurated: true,
      featured: false,
      isAffiliate: isAmazonUrl(url.href),
    },
  };
}

export function previewResourceImport(input: unknown, existingResources: readonly unknown[]): ResourceImportPreview {
  if (!Array.isArray(input)) {
    throw new ResourceImportInputError('not_array', 'The top-level JSON value must be an array of resources.');
  }
  if (input.length === 0) {
    throw new ResourceImportInputError('empty_batch', 'The resource array is empty.');
  }
  const taxonomy = createResourceTaxonomy(existingResources);
  const existingUrls = new Set(existingResources.flatMap((value) => {
    const record = asRecord(value);
    const url = stringValue(record?.url);
    return url ? [duplicateKey(url)] : [];
  }));
  const uploadUrls = new Map<string, number>();
  const rows = input.map((value, index) => {
    const validated = validateRow(value, index + 1, taxonomy, existingUrls, uploadUrls);
    return {
      row: index + 1,
      status: validated.issues.length === 0 ? 'ready' as const : 'invalid' as const,
      issues: validated.issues,
      ...(validated.item ? { item: validated.item } : {}),
    };
  });
  const items = rows.flatMap(row => row.item ? [row.item] : []);
  const invalid = rows.filter(row => row.status === 'invalid').length;
  return {
    canImport: rows.length > 0 && invalid === 0,
    total: rows.length,
    ready: items.length,
    invalid,
    rows,
    items,
  };
}

export interface CommitResourceImportOptions {
  now?: Date;
  idFactory?: () => string;
  write: (resources: StoredResource[]) => void;
}

export function commitResourceImport(
  input: unknown,
  existingResources: readonly unknown[],
  options: CommitResourceImportOptions,
): StoredResource[] {
  const preview = previewResourceImport(input, existingResources);
  if (!preview.canImport) throw new ResourceImportValidationError(preview);
  const usedIds = new Set(existingResources.flatMap(value => {
    const id = stringValue(asRecord(value)?.id);
    return id ? [id] : [];
  }));
  const createId = options.idFactory ?? randomUUID;
  const addedDate = (options.now ?? new Date()).toISOString().slice(0, 10);
  const created = preview.items.map(item => {
    let id = createId();
    while (usedIds.has(id)) id = createId();
    usedIds.add(id);
    return { id, ...item, addedDate };
  });
  const combined = [...existingResources as StoredResource[], ...created];
  options.write(combined);
  return created;
}
