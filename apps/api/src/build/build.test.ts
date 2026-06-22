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
import { videoAllowedFor, chooseProvider } from '../services/video.js';
import { isOwner, getUserPlan } from '../services/planStore.js';
import { classifyTask, ROUTES } from '../brains/router.js';
import { matchSkill, listSkills } from '../brains/skills.js';
import { monetizationMetrics } from '../services/admin.js';
import { OWNER_KEYS, setPlatformKey } from '../services/platformKeys.js';

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
  // No keys set in test env → no engine available.
  assert.equal(chooseProvider(), null);
});

test('owner gets full top-tier access (unlocks video, full council, big builds)', async () => {
  assert.equal(isOwner('proppapromo@gmail.com'), true);
  assert.equal(isOwner('PROPPAPROMO@Gmail.com'), true); // case-insensitive
  assert.equal(isOwner('someone-else@example.com'), false);
  assert.equal(await getUserPlan('proppapromo@gmail.com'), 'enterprise');
  assert.equal(videoAllowedFor(await getUserPlan('proppapromo@gmail.com')), true);
});

test('classifyTask: routes for speed', () => {
  assert.equal(classifyTask("what's on my calendar today?"), 'fast');
  assert.equal(classifyTask('remind me to call mom at 5'), 'fast');
  assert.equal(classifyTask('help me plan my business operations for Q3'), 'medium');
  assert.equal(classifyTask('analyze this contract and flag legal risks'), 'heavy');
  assert.equal(classifyTask('describe this', true), 'visual'); // has images
  // Speed map points each tier at the intended engine.
  assert.equal(ROUTES.fast.provider, 'gemini');
  assert.equal(ROUTES.medium.provider, 'openai');
  assert.equal(ROUTES.heavy.provider, 'anthropic');
});

test('skills: voice cloning/recognition are owner-only and talk-triggered', () => {
  assert.equal(matchSkill('clone my voice')?.id, 'voice-clone');
  assert.equal(matchSkill('I want to record my voice')?.id, 'voice-clone');
  assert.equal(matchSkill('turn on voice recognition')?.id, 'voice-recognition');
  assert.equal(matchSkill('what is the weather'), null);
  const voice = listSkills().filter((s) => s.id.startsWith('voice'));
  assert.ok(voice.length >= 2 && voice.every((s) => s.ownerOnly));
});

test('admin metrics + owner keys', async () => {
  const m = await monetizationMetrics();
  assert.ok(typeof m.mrr === 'number' && typeof m.arr === 'number' && typeof m.conversion === 'number');
  assert.ok(m.arr === Math.round(m.mrr * 12 * 100) / 100);
  // Owner key whitelist gates what can be set in-app.
  assert.ok(OWNER_KEYS.includes('STRIPE_SECRET_KEY') && OWNER_KEYS.includes('RUNWAY_API_KEY'));
  await assert.rejects(() => setPlatformKey('NOT_AN_OWNER_KEY', 'x'));
});

test('genome soul: five laws and seven organs are present', () => {
  assert.equal(CONSTRUCTION_LAWS.length, 5);
  assert.equal(CONSTRUCTION_ORGANS.length, 7);
});
