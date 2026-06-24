/**
 * proactive.ts — ORB's proactive worker brain. The foundation a long line of "altitude" layers asked
 * for but never had: instead of only reasoning when asked, ORB periodically scans the per-user state it
 * already stores (goals, coherence, objectives, habits) and surfaces what deserves attention on its own.
 *
 * This is the real, run-over-time substrate — not another directive. The scan is split into a PURE,
 * deterministic core (buildInsights) that's directly tested, and a never-throws gatherer (scanUser) that
 * pulls the live stores. A cron/worker process drives runTick() (see src/worker/tick.ts); the surfaced-
 * tracking keeps it from repeating the same nudge every cycle. Human stays sovereign — insights are
 * surfaced, never acted on automatically.
 */
import type { Goal } from './goals.js';
import { goalScore, nudgeFor, pendingGoals } from './goals.js';
import { detectCoherenceGaps, type CoherenceGap } from './coherence.js';
import { listObjectives, progressOf, type Objective } from './objectives.js';
import { habitPredictions } from './events.js';
import { supabase } from './supabase.js';

export type Insight = { kind: 'nudge' | 'coherence' | 'stalled' | 'habit'; key: string; priority: number; message: string };

const DAY = 86_400_000;

/**
 * Pure: turn the user's stored state into a prioritized list of things worth surfacing. Deterministic
 * (caller passes `now`), so it's tested directly. Highest-priority first, deduped by key, capped.
 */
export function buildInsights(
  input: { goals: Goal[]; gaps: CoherenceGap[]; objectives: Objective[]; habits: string[]; now: number },
  max = 5,
): Insight[] {
  const out: Insight[] = [];

  // High-value things kept on the back burner — the nudge ORB would otherwise only give when asked.
  for (const g of input.goals) {
    if (g.done) continue;
    const msg = nudgeFor(g);
    if (msg) out.push({ kind: 'nudge', key: `nudge:${g.id}`, priority: 100 + goalScore(g), message: msg });
  }

  // Stated-important-but-deferred goals (the #28 coherence gap), surfaced proactively.
  for (const gap of input.gaps) {
    out.push({ kind: 'coherence', key: `coh:${gap.action.toLowerCase()}`, priority: 80 + gap.importance + gap.deferrals, message: gap.note });
  }

  // Objectives that have gone quiet: real progress < 100% and untouched for 21+ days. progressOf is a
  // percent (0-100), not a fraction.
  for (const o of input.objectives) {
    const pct = progressOf(o);
    if (pct === null || pct >= 100) continue;
    const idleDays = Math.floor((input.now - o.updated) / DAY);
    if (idleDays >= 21) {
      out.push({ kind: 'stalled', key: `stall:${o.id}`, priority: 60 + Math.min(30, idleDays), message: `"${o.label}" has been at ${pct}% with no movement for ${idleDays} days — worth a push or a rethink?` });
    }
  }

  // One ambient habit observation, low priority (informational, not a prod).
  if (input.habits.length) {
    out.push({ kind: 'habit', key: `habit:${input.habits[0]}`, priority: 20, message: input.habits[0] });
  }

  // Dedupe by key (keep highest priority), sort, cap.
  const best = new Map<string, Insight>();
  for (const i of out) { const prev = best.get(i.key); if (!prev || i.priority > prev.priority) best.set(i.key, i); }
  return [...best.values()].sort((a, b) => b.priority - a.priority).slice(0, max);
}

/** One human-readable digest of what ORB would proactively raise. '' when nothing is worth surfacing. */
export function formatDigest(insights: Insight[]): string {
  if (!insights.length) return '';
  return 'A few things I\'d raise proactively:\n' + insights.map((i) => `• ${i.message}`).join('\n');
}

/** Gather the live per-user state and build insights. Never throws — a scan failure surfaces nothing. */
export async function scanUser(userId: string, now = Date.now()): Promise<Insight[]> {
  try {
    const goals = await pendingGoals(userId, 12).catch(() => []);
    const gaps = detectCoherenceGaps(goals);
    const objectives = await listObjectives(userId).catch(() => []);
    const habits = await habitPredictions(userId).catch(() => []);
    return buildInsights({ goals, gaps, objectives, habits, now });
  } catch { return []; }
}

// Surfaced-tracking so the worker doesn't repeat the same insight every cycle. In-memory; a cooldown
// window means a genuinely-still-relevant item can resurface after it lapses.
const COOLDOWN = 3 * DAY;
const surfaced = new Map<string, number>();   // `${userId}|${key}` -> last surfaced ms

/** Filter to insights not surfaced within the cooldown, and mark the survivors as surfaced. */
export function freshInsights(userId: string, insights: Insight[], now = Date.now()): Insight[] {
  const fresh = insights.filter((i) => {
    const k = `${userId}|${i.key}`;
    const last = surfaced.get(k) ?? 0;
    return now - last >= COOLDOWN;
  });
  for (const i of fresh) surfaced.set(`${userId}|${i.key}`, now);
  return fresh;
}

/** One worker pass over a set of users: returns the fresh insights per user (caller persists/notifies). */
export async function runTick(userIds: string[], now = Date.now()): Promise<{ userId: string; insights: Insight[] }[]> {
  const results: { userId: string; insights: Insight[] }[] = [];
  for (const userId of userIds) {
    const all = await scanUser(userId, now);
    const fresh = freshInsights(userId, all, now);
    if (fresh.length) { await persistInsights(userId, fresh, now); results.push({ userId, insights: fresh }); }
  }
  return results;
}

// ── Durable read model ────────────────────────────────────────────────────────────────────────────
// What the worker surfaced, so it survives a restart and the web app / next session can show it. Keyed
// by (userId, key); re-surfacing an existing key refreshes it without clobbering a 'seen' the user set,
// unless the cooldown lapsed (handled upstream by freshInsights). Supabase-backed (orb_insights) with an
// in-memory fallback. Never throws.
export type StoredInsight = Insight & { surfaced: number; seen: boolean };
const store = new Map<string, Map<string, StoredInsight>>();
function umap(userId: string): Map<string, StoredInsight> { let m = store.get(userId); if (!m) { m = new Map(); store.set(userId, m); } return m; }

/** Record surfaced insights as pending (unseen). Idempotent per key. Never throws. */
export async function persistInsights(userId: string, insights: Insight[], now = Date.now()): Promise<void> {
  const m = umap(userId);
  for (const i of insights) {
    m.set(i.key, { ...i, surfaced: now, seen: false });
    if (supabase) {
      try {
        await supabase.from('orb_insights').upsert(
          { user_id: userId, key: i.key, kind: i.kind, message: i.message, priority: i.priority, surfaced: new Date(now).toISOString(), seen: false },
          { onConflict: 'user_id,key' },
        );
      } catch { /* in-memory */ }
    }
  }
}

async function loadStore(userId: string): Promise<Map<string, StoredInsight>> {
  const m = umap(userId);
  if (m.size || !supabase) return m;
  try {
    const { data } = await supabase.from('orb_insights').select('key,kind,message,priority,surfaced,seen').eq('user_id', userId);
    for (const r of data ?? []) m.set(r.key, { kind: r.kind, key: r.key, message: r.message, priority: r.priority || 0, surfaced: Date.parse(r.surfaced) || Date.now(), seen: !!r.seen });
  } catch { /* in-memory */ }
  return m;
}

/** The pending (unseen) insights for a user, highest priority first — what the UI shows. */
export async function pendingInsights(userId: string): Promise<StoredInsight[]> {
  const m = await loadStore(userId);
  return [...m.values()].filter((x) => !x.seen).sort((a, b) => b.priority - a.priority);
}

/** Mark insights seen so they stop showing. Empty keys → marks all pending. Never throws. */
export async function markSeen(userId: string, keys: string[] = []): Promise<void> {
  const m = await loadStore(userId);
  const targets = keys.length ? keys : [...m.values()].filter((x) => !x.seen).map((x) => x.key);
  for (const k of targets) { const x = m.get(k); if (x) x.seen = true; }
  if (supabase && targets.length) {
    try { await supabase.from('orb_insights').update({ seen: true }).eq('user_id', userId).in('key', targets); } catch { /* in-memory */ }
  }
}

/** Test-only: reset the in-memory store. */
export function _resetStore(): void { store.clear(); }
