import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBusiness, setBusiness, getBusiness, formatBusiness, PROBLEMS_QUERY, EYES_AND_EARS } from './business.js';

test('parseBusiness: extracts explicit business facts, ignores normal chat', () => {
  assert.equal(parseBusiness('my business is a coffee roastery in Austin')?.description, 'a coffee roastery in Austin');
  assert.equal(parseBusiness('our top priority is cutting churn this quarter')?.priorities?.[0], 'cutting churn this quarter');
  assert.equal(parseBusiness('track monthly recurring revenue')?.metrics?.[0], 'monthly recurring revenue');
  assert.match(parseBusiness('note about the business: our supplier is unreliable')?.notes?.[0] ?? '', /supplier is unreliable/);
  // Normal questions don't register as business facts.
  assert.equal(parseBusiness('what time is my meeting'), null);
  assert.equal(parseBusiness('how do I improve focus'), null);
});

test('business profile: merges (dedupe/append) and formats standing context', async () => {
  const u = 'biz-test-user';
  await setBusiness(u, { description: 'a coffee roastery', priorities: ['cut churn'], metrics: ['MRR'] });
  await setBusiness(u, { priorities: ['cut churn', 'launch wholesale'], notes: ['supplier unreliable'] });
  const b = await getBusiness(u);
  assert.equal(b.description, 'a coffee roastery');
  assert.deepEqual(b.priorities, ['cut churn', 'launch wholesale']);   // deduped + appended
  assert.deepEqual(b.metrics, ['MRR']);
  const ctx = formatBusiness(b);
  assert.match(ctx, /coffee roastery/);
  assert.match(ctx, /cut churn; launch wholesale/);
  assert.match(ctx, /MRR/);
  assert.match(ctx, /decision-maker/);   // keeps the human-sovereign framing
  // Empty profile → empty context.
  assert.equal(formatBusiness({ name: '', description: '', priorities: [], metrics: [], notes: [], updated: 0 }), '');
});

test('eyes-and-ears: identity line and problem-scan trigger', () => {
  assert.match(EYES_AND_EARS, /eyes and ears|decision-maker|confirm|run by you/i);
  for (const s of ['what do you see', "what's wrong", 'what needs fixing', 'any problems', 'audit my business']) {
    assert.ok(PROBLEMS_QUERY.test(s), s);
  }
  assert.equal(PROBLEMS_QUERY.test('what time is my meeting'), false);
});
