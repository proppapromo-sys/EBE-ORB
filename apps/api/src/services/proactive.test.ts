import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInsights, formatDigest, freshInsights, persistInsights, pendingInsights, markSeen, connectorInsights, _resetStore, type Insight } from './proactive.js';
import type { Goal } from './goals.js';
import type { Objective } from './objectives.js';

const NOW = 1_700_000_000_000;
const DAY = 86_400_000;

function goal(over: Partial<Goal>): Goal {
  return { id: 'g', action: 'do thing', importance: 3, created: NOW, lastSeen: NOW, deferrals: 3, done: false, ...over };
}
function obj(over: Partial<Objective>): Objective {
  return { id: 'o', label: 'ship v2', level: 'strategic', type: 'outcome', start: 0, current: 30, target: 100, created: NOW, updated: NOW, ...over };
}

test('buildInsights: surfaces a nudge for a high-value repeatedly-deferred goal', () => {
  const insights = buildInsights({ goals: [goal({ id: 'a', action: 'call the lawyer', importance: 3, deferrals: 3 })], gaps: [], objectives: [], habits: [], now: NOW });
  assert.equal(insights.length, 1);
  assert.equal(insights[0].kind, 'nudge');
  assert.match(insights[0].message, /call the lawyer/);
});

test('buildInsights: surfaces coherence gaps and stalled objectives, highest priority first', () => {
  const insights = buildInsights({
    goals: [],
    gaps: [{ action: 'exercise', importance: 3, deferrals: 4, note: 'You called "exercise" important but keep deferring it.' }],
    objectives: [obj({ id: 'o1', label: 'ship v2', current: 30, target: 100, updated: NOW - 22 * DAY })],
    habits: ['You usually focus in the morning.'],
    now: NOW,
  });
  const kinds = insights.map((i) => i.kind);
  assert.ok(kinds.includes('coherence'));
  assert.ok(kinds.includes('stalled'));
  assert.ok(kinds.includes('habit'));
  // Coherence (80+) outranks stalled (60+) outranks habit (20).
  assert.equal(insights[0].kind, 'coherence');
  assert.equal(insights[insights.length - 1].kind, 'habit');
});

test('buildInsights: a fresh, on-track objective is not flagged as stalled', () => {
  const insights = buildInsights({ goals: [], gaps: [], objectives: [obj({ updated: NOW - 2 * DAY })], habits: [], now: NOW });
  assert.equal(insights.length, 0);
  // A completed objective (>=100%) is never stalled either.
  const done = buildInsights({ goals: [], gaps: [], objectives: [obj({ current: 100, target: 100, updated: NOW - 90 * DAY })], habits: [], now: NOW });
  assert.equal(done.length, 0);
});

test('buildInsights: dedupes by key and caps the list', () => {
  const objs = Array.from({ length: 10 }, (_, i) => obj({ id: `o${i}`, label: `obj ${i}`, updated: NOW - (30 + i) * DAY }));
  const insights = buildInsights({ goals: [], gaps: [], objectives: objs, habits: [], now: NOW }, 5);
  assert.equal(insights.length, 5);
  // Empty input → nothing, and the digest is blank.
  assert.equal(buildInsights({ goals: [], gaps: [], objectives: [], habits: [], now: NOW }).length, 0);
  assert.equal(formatDigest([]), '');
});

test('persist + pending + markSeen: durable queue the UI reads, then dismisses', async () => {
  _resetStore();
  const ins: Insight[] = [
    { kind: 'nudge', key: 'nudge:a', priority: 120, message: 'call the lawyer' },
    { kind: 'coherence', key: 'coh:exercise', priority: 87, message: 'you keep deferring exercise' },
  ];
  await persistInsights('u1', ins, NOW);
  const pending = await pendingInsights('u1');
  assert.equal(pending.length, 2);
  assert.equal(pending[0].key, 'nudge:a');          // highest priority first
  assert.equal(pending[0].seen, false);
  // Dismiss one → only the other remains pending.
  await markSeen('u1', ['nudge:a']);
  const after = await pendingInsights('u1');
  assert.equal(after.length, 1);
  assert.equal(after[0].key, 'coh:exercise');
  // markSeen with no keys clears the rest.
  await markSeen('u1');
  assert.equal((await pendingInsights('u1')).length, 0);
  // Another user is isolated.
  assert.equal((await pendingInsights('u2')).length, 0);
});

test('connectorInsights: surfaces soon meetings, tight back-to-backs, and email backlog', () => {
  const iso = (minsFromNow: number) => new Date(NOW + minsFromNow * 60_000).toISOString();
  const out = connectorInsights({
    events: [
      { summary: 'Standup', start: iso(30) },        // soon → surfaced
      { summary: 'Standup b2b', start: iso(33) },     // 3 min after → tight back-to-back
      { summary: 'All-hands next week', start: '2025-12-01' }, // all-day, no time → ignored
      { summary: 'Already over', start: iso(-20) },   // past → ignored
      { summary: 'Way later', start: iso(600) },      // outside 120-min window → ignored
    ],
    unreadImportant: 7,
    now: NOW,
  });
  const kinds = out.map((i) => i.kind);
  assert.ok(out.some((i) => i.kind === 'calendar' && /Coming up/.test(i.message)));
  assert.ok(out.some((i) => /back-to-back/i.test(i.message)));      // clash detected
  assert.ok(out.some((i) => i.kind === 'inbox' && /7 important/.test(i.message)));
  // The all-day, past, and far-future events produced nothing extra beyond the two soon + clash + inbox.
  assert.ok(!out.some((i) => /All-hands|Already over|Way later/.test(i.message)));
  // Nothing in, nothing out.
  assert.equal(connectorInsights({ events: [], unreadImportant: 0, now: NOW }).length, 0);
  // A small inbox (under threshold) isn't flagged.
  assert.equal(connectorInsights({ events: [], unreadImportant: 3, now: NOW }).length, 0);
});

test('freshInsights: cooldown prevents re-surfacing the same insight, then lapses', () => {
  const ins: Insight[] = [{ kind: 'nudge', key: 'nudge:a', priority: 100, message: 'do the thing' }];
  const first = freshInsights('u1', ins, NOW);
  assert.equal(first.length, 1);                       // first time: surfaced
  const again = freshInsights('u1', ins, NOW + DAY);   // within 3-day cooldown: suppressed
  assert.equal(again.length, 0);
  const later = freshInsights('u1', ins, NOW + 4 * DAY); // after cooldown: resurfaces
  assert.equal(later.length, 1);
  // Different user is tracked independently.
  assert.equal(freshInsights('u2', ins, NOW + DAY).length, 1);
});
