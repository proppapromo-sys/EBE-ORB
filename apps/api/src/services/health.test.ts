import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assess, brokenSystems, formatHealth, HEALTH_QUERY, type SystemHealth } from './health.js';

test('assess: classifies each retrieved status correctly', () => {
  assert.equal(assess('connected'), 'healthy');
  assert.equal(assess('connected', true), 'healthy');
  assert.equal(assess('connected', false), 'degraded');   // connected but a live read failed
  assert.equal(assess('error'), 'down');                   // connected but the API is erroring = broken
  assert.equal(assess('needs_auth'), 'not_connected');
  assert.equal(assess('disabled'), 'disabled');
});

test('brokenSystems + formatHealth: surface the broken/damaged first', () => {
  const now = new Date().toISOString();
  const reports: SystemHealth[] = [
    { system: 'Stripe', domain: 'money', state: 'down', detail: 'Stripe rejected that key', checkedAt: now },
    { system: 'Calendar', domain: 'time', state: 'healthy', detail: 'connected and responding', checkedAt: now },
    { system: 'Shopify', domain: 'commerce', state: 'degraded', detail: 'a live read failed', checkedAt: now },
    { system: 'Gmail', domain: 'comms', state: 'not_connected', detail: 'not connected yet', checkedAt: now },
  ];
  const broken = brokenSystems(reports);
  assert.equal(broken.length, 2);
  assert.deepEqual(broken.map((b) => b.system).sort(), ['Shopify', 'Stripe']);
  const txt = formatHealth(reports);
  assert.match(txt, /2 systems need attention/);
  assert.match(txt, /Stripe — DOWN: Stripe rejected that key/);
  assert.match(txt, /1 healthy · 2 broken · 1 not connected/);
  // All-healthy reads clean.
  assert.match(formatHealth([{ system: 'Calendar', domain: 'time', state: 'healthy', detail: 'ok', checkedAt: now }]), /All 1 connected system is healthy/);
  assert.equal(formatHealth([]).length > 0, true);
});

test('HEALTH_QUERY: triggers on diagnostics phrasing, not normal chat', () => {
  for (const s of ['run a diagnostic', 'is anything broken', 'assess my systems', "what's down", 'are my connections working', 'system health']) {
    assert.ok(HEALTH_QUERY.test(s), s);
  }
  assert.equal(HEALTH_QUERY.test('what time is my meeting'), false);
});
