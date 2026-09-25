import assert from 'node:assert/strict';
import test from 'node:test';
import { isNewResource } from '../data.ts';

const now = new Date('2026-09-13T00:00:00.000Z');

test('a resource added less than 30 days ago is New', () => {
  assert.equal(isNewResource('2026-08-15', now), true);
});

test('a resource at or beyond the 30-day boundary is not New', () => {
  assert.equal(isNewResource('2026-08-14', now), false);
  assert.equal(isNewResource('2026-08-13', now), false);
});
