/**
 * build.test.ts — deterministic tests for the Universal Construction Genome (no network).
 * Run:  npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inferCategory, getBlueprint } from './blueprints.js';
import { buildCapability } from './tiers.js';
import { CONSTRUCTION_LAWS, CONSTRUCTION_ORGANS } from './genome.js';
import { looksLikeBuildRequest, looksLikeVideoRequest } from '../agents/masterAgent.js';
import { videoAllowedFor } from '../services/veo.js';
import { isOwner, getUserPlan } from '../services/planStore.js';

test('inferCategory: reads build family from a plain brief', () => {
  assert.equal(inferCategory('a booking app for a barbershop'), 'mobile');
  assert.equal(inferCategory('online store to sell candles with checkout'), 'ecommerce');
  assert.equal(inferCategory('a SaaS dashboard with login and users'), 'webapp');
  assert.equal(inferCategory('a landing page for my consultancy'), 'marketing');
  assert.equal(inferCategory('something nice for my brand'), 'marketing'); // default
});

test('getBlueprint: every category resolves to a real blueprint', () => {
  for (const cat of ['marketing', 'webapp', 'ecommerce', 'mobile'] as const) {
    const bp = getBlueprint(cat);
    assert.equal(bp.category, cat);
    assert.ok(bp.stack.length > 0 && bp.structure.length > 0 && bp.launchChecklist.length > 0);
  }
});

test('buildCapability: power scales with tier', () => {
  const free = buildCapability('free');
  const exec = buildCapability('executive');
  assert.equal(free.canDeploy, false);
  assert.equal(exec.canDeploy, true);
  assert.ok(exec.maxFiles > free.maxFiles);
  assert.equal(buildCapability(undefined).plan, 'free'); // unknown → free
  assert.equal(buildCapability('enterprise').maxFiles >= exec.maxFiles, true);
});

test('looksLikeBuildRequest: routes real build asks, ignores look-alikes', () => {
  assert.equal(looksLikeBuildRequest('build me a landing page for my barbershop'), true);
  assert.equal(looksLikeBuildRequest('create an online store for candles'), true);
  assert.equal(looksLikeBuildRequest('make a booking app for my salon'), true);
  assert.equal(looksLikeBuildRequest('build my confidence'), false);   // intent but no target
  assert.equal(looksLikeBuildRequest('what is the weather today?'), false);
});

test('looksLikeVideoRequest + tier gate', () => {
  assert.equal(looksLikeVideoRequest('make me a video of waves on a beach'), true);
  assert.equal(looksLikeVideoRequest('generate a short clip of a city at night'), true);
  assert.equal(looksLikeVideoRequest('what video should I watch'), false); // no intent verb
  assert.equal(videoAllowedFor('executive'), true);
  assert.equal(videoAllowedFor('enterprise'), true);
  assert.equal(videoAllowedFor('pro'), false);   // video reserved for top tiers
  assert.equal(videoAllowedFor('free'), false);
});

test('owner gets full top-tier access (unlocks video, full council, big builds)', async () => {
  assert.equal(isOwner('proppapromo@gmail.com'), true);
  assert.equal(isOwner('PROPPAPROMO@Gmail.com'), true); // case-insensitive
  assert.equal(isOwner('someone-else@example.com'), false);
  assert.equal(await getUserPlan('proppapromo@gmail.com'), 'enterprise');
  assert.equal(videoAllowedFor(await getUserPlan('proppapromo@gmail.com')), true);
});

test('genome soul: five laws and seven organs are present', () => {
  assert.equal(CONSTRUCTION_LAWS.length, 5);
  assert.equal(CONSTRUCTION_ORGANS.length, 7);
});
