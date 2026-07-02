import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getIntegration, testConnection, INTEGRATIONS } from './integrations.js';

test('custom provider is in the catalog with a URL field', () => {
  const custom = getIntegration('custom');
  assert.ok(custom, 'custom integration should exist');
  assert.equal(custom!.provider, 'custom');
  assert.ok(custom!.fields.some((f) => f.key === 'url'), 'has a url field');
  assert.ok(custom!.fields.some((f) => f.key === 'apiKey'), 'has an optional token field');
});

test('every catalog entry exposes provider + label + at least one field', () => {
  for (const i of INTEGRATIONS) {
    assert.ok(i.provider && i.label && i.fields.length > 0, i.provider);
  }
});

test('custom testConnection: refuses to fetch without a valid URL', async () => {
  assert.equal((await testConnection('custom', {})).ok, false);
  assert.equal((await testConnection('custom', { url: '' })).ok, false);
  assert.equal((await testConnection('custom', { url: 'not a url' })).ok, false);
});

test('unknown provider returns a clean not-wired note, never throws', async () => {
  const r = await testConnection('nope', {});
  assert.equal(r.ok, false);
  assert.match(r.note, /No test wired/);
});
