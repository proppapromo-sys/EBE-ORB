/**
 * genome.test.ts — deterministic unit tests for the Universal Genome core.
 * Run:  npm test   (node --test via tsx)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Risk, Portfolio, saneItem, edgeOf, patternTrust, categoryTrust,
  LearningEyes, Machine, Journal, type Item, type Pattern, type EdgeModel, type DataFeed, type Execution
} from './genome.js';

class TestRisk extends Risk {
  kelly(_item: Item, edge: number): number { return edge; }
}

test('Risk.gate: no edge below minEdge → veto', () => {
  const r = new TestRisk({ bankroll: 1000, minEdge: 0.05 });
  const d = r.gate({ id: 'x' }, 0.01);
  assert.equal(d.ok, false);
  assert.match(d.reason, /no edge/);
});

test('Risk.gate: edge above gate → ok with positive capped stake', () => {
  const r = new TestRisk({ bankroll: 1000, minEdge: 0.05, maxPer: 0.02 });
  const d = r.gate({ id: 'x' }, 0.5);
  assert.equal(d.ok, true);
  assert.ok(d.stake > 0);
  assert.ok(d.stake <= 0.02 * 1000 + 1e-9, 'stake respects maxPer cap');
});

test('Risk.gate: kill-switch and daily stop veto everything', () => {
  const r = new TestRisk({ bankroll: 1000, minEdge: 0.01 });
  r.killed = true;
  assert.equal(r.gate({ id: 'x' }, 0.9).ok, false);
  r.killed = false;
  r.dayPnl = -1000;
  assert.match(r.gate({ id: 'x' }, 0.9).reason, /daily stop/);
});

test('Portfolio cap blocks over-commit', () => {
  const pf = new Portfolio(200);
  const r = new TestRisk({ bankroll: 1000, minEdge: 0.01, maxPer: 1, portfolio: pf });
  const first = r.gate({ id: 'a' }, 0.5); // stake = 0.25*0.5*1000 = 125, fits in 200
  assert.equal(first.ok, true);
  pf.commit(pf.free); // exhaust the remaining portfolio
  assert.match(r.gate({ id: 'b' }, 0.5).reason, /portfolio cap/);
});

test('saneItem rejects bad inputs, passes good ones', () => {
  assert.equal(saneItem({ id: 'a', cost: 5, price: 10 }), null);
  assert.match(String(saneItem({ id: 'a', cost: -1 })), /invalid|> 0/);
  assert.match(String(saneItem({ id: 'a', price: Number.NaN })), /invalid/);
  assert.match(String(saneItem({ id: 'a', cost: 'x' as unknown as number })), /not numeric/);
});

test('edgeOf = mine - fair', () => {
  const m: EdgeModel = { fair: () => 0.5, mine: () => 0.62 };
  assert.ok(Math.abs(edgeOf(m, { id: 'a' }) - 0.12) < 1e-9);
});

test('categoryTrust: proven category climbs above 0.55 vote bar, dud sinks', () => {
  const j = new Journal();
  const recs = [
    { kind: 'decision' as const, id: 'a', category: 'win' },
    { kind: 'decision' as const, id: 'b', category: 'lose' }
  ];
  // 6 wins for 'win', 6 losses for 'lose'
  const all = [...recs];
  for (let i = 0; i < 6; i++) {
    all.push({ kind: 'outcome' as const, id: 'a', category: 'win', score: 1 } as never);
    all.push({ kind: 'outcome' as const, id: 'b', category: 'lose', score: -1 } as never);
  }
  const trust = categoryTrust(all as never);
  assert.ok(trust['win'] > 0.55, `win trust ${trust['win']} should exceed 0.55`);
  assert.ok(trust['lose'] < 0.45, `lose trust ${trust['lose']} should sink`);
  void j;
});

test('LearningEyes only graduates patterns at/above the trust bar', () => {
  const eyes = new (class extends LearningEyes {
    detect(): Pattern[] { return [{ name: 'proven', dir: 1 }, { name: 'unproven', dir: 1 }]; }
  })({ proven: 0.7, unproven: 0.5 });
  const confirmed = eyes.confirm({ id: 'x' });
  assert.deepEqual(confirmed, ['proven']);
});

test('Machine.cycle: drops bad, gates the rest, records decisions', async () => {
  const feed: DataFeed = {
    candidates: () => [
      { id: 'good', category: 'c', cost: 5, world: 0.5, you: 0.7 },
      { id: 'bad', category: 'c', cost: -1 } // sanity-gated out
    ]
  };
  const edge: EdgeModel = { fair: (i) => Number(i.world ?? 0.5), mine: (i) => Number(i.you ?? 0.5) };
  const risk = new TestRisk({ bankroll: 1000, minEdge: 0.05, maxPer: 1 });
  const exe: Execution = { place: () => {} };
  const journal = new Journal();
  const m = new Machine({ feed, edge, risk, eyes: new LearningEyes(), exe, journal });
  const res = await m.cycle(true);
  assert.equal(res.dropped.length, 1, 'bad item dropped');
  assert.equal(res.tickets.length, 1, 'good item ticketed');
  assert.equal(res.tickets[0].item.id, 'good');
  const recorded = await journal.read();
  assert.ok(recorded.some((r) => r.kind === 'decision' && r.id === 'good'));
});

test('patternTrust shrinks toward prior with little evidence', () => {
  const recs = [
    { kind: 'decision' as const, id: 'a', patterns: ['p'] },
    { kind: 'outcome' as const, id: 'a', patterns: ['p'], score: 1 }
  ];
  const t = patternTrust(recs as never);
  // one win should not be enough to graduate (shrunk toward 0.5)
  assert.ok(t['p'] < 0.55, `single win trust ${t['p']} must stay below the 0.55 bar`);
});
