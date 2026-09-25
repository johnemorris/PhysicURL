import assert from 'node:assert/strict';
import test from 'node:test';
import {
  commitResourceImport,
  parseResourceImportJson,
  previewResourceImport,
  ResourceImportInputError,
  ResourceImportValidationError,
} from '../index.ts';
import type { StoredResource } from '../types.ts';

const existing: StoredResource[] = [{
  id: 'existing',
  title: 'Existing resource',
  url: 'https://existing.example/',
  domain: 'existing.example',
  description: '',
  science: 'physics',
  subdiscipline: 'Quantum Mechanics',
  resourceType: 'reference',
  access: 'open',
  rating: null,
  yearEstablished: '',
  tags: [],
  isVerified: false,
  isCurated: true,
  featured: false,
  isAffiliate: false,
  addedDate: '2026-01-01',
}];

const validItem = {
  name: 'Launch resource',
  url: 'https://new.example/path',
  description: 'Safe text',
  science: 'Physics',
  subdiscipline: 'Quantum Mechanics',
  access: 'open',
  resource_type: 'reference',
  tags: ['launch'],
};

test('valid JSON batch reaches a clean preview', () => {
  const parsed = parseResourceImportJson(JSON.stringify([validItem]));
  const preview = previewResourceImport(parsed, existing);
  assert.equal(preview.canImport, true);
  assert.equal(preview.ready, 1);
  assert.equal(preview.items[0].domain, 'new.example');
  assert.equal(preview.items[0].science, 'physics');
});

test('malformed, object, and empty JSON inputs fail clearly', () => {
  assert.throws(() => parseResourceImportJson('{oops'), (error: unknown) => (
    error instanceof ResourceImportInputError && error.code === 'malformed_json'
  ));
  assert.throws(() => parseResourceImportJson('{"name":"not an array"}'), (error: unknown) => (
    error instanceof ResourceImportInputError && error.code === 'not_array'
  ));
  assert.throws(() => parseResourceImportJson('[]'), (error: unknown) => (
    error instanceof ResourceImportInputError && error.code === 'empty_batch'
  ));
});

test('duplicates within the upload and against existing resources are identified', () => {
  const preview = previewResourceImport([
    validItem,
    { ...validItem },
    { ...validItem, name: 'Existing duplicate', url: 'https://existing.example' },
  ], existing);
  assert.equal(preview.canImport, false);
  assert.equal(preview.rows[1].issues[0].code, 'duplicate_upload');
  assert.equal(preview.rows[2].issues[0].code, 'duplicate_existing');
});

test('unknown taxonomy and missing required fields produce row-level issues', () => {
  const preview = previewResourceImport([{ url: 'https://new.example', science: 'Alchemy', subdiscipline: 'Transmutation' }], existing);
  assert.equal(preview.canImport, false);
  assert.ok(preview.rows[0].issues.some(issue => issue.field === 'title' && issue.code === 'required'));
  assert.ok(preview.rows[0].issues.some(issue => issue.field === 'science' && issue.code === 'unknown_taxonomy'));
});

test('commit assigns server-owned metadata and ignores uploaded internal metadata', () => {
  let persisted: StoredResource[] | undefined;
  const created = commitResourceImport([{
    ...validItem,
    id: 'attacker-id',
    domain: 'attacker.example',
    addedDate: '1999-01-01',
    isVerified: true,
    featured: true,
  }], existing, {
    idFactory: () => 'server-id',
    now: new Date('2026-09-13T12:00:00.000Z'),
    write: resources => { persisted = resources; },
  });
  assert.equal(created[0].id, 'server-id');
  assert.equal(created[0].domain, 'new.example');
  assert.equal(created[0].addedDate, '2026-09-13');
  assert.equal(created[0].isVerified, false);
  assert.equal(created[0].featured, false);
  assert.equal(persisted?.length, 2);
});

test('failed validation and failed persistence do not mutate existing resources', () => {
  const snapshot = structuredClone(existing);
  let writeCalled = false;
  assert.throws(() => commitResourceImport([{ ...validItem, url: existing[0].url }], existing, {
    write: () => { writeCalled = true; },
  }), ResourceImportValidationError);
  assert.equal(writeCalled, false);
  assert.throws(() => commitResourceImport([validItem], existing, {
    write: () => { throw new Error('disk full'); },
  }), /disk full/);
  assert.deepEqual(existing, snapshot);
});
