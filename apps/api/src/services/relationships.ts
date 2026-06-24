/**
 * relationships.ts — ORB's Social Intelligence / Trust layer (part of #12 Collective Intelligence).
 * Every social system runs on trust. ORB tracks, across the user's relationships, who delivers and who
 * drops the ball — reliability, consistency, reputation — so it can answer "who can I count on?" and
 * weigh whom to lean on. (The Council is already ORB's many-minds collective intelligence; the
 * knowledge graph already maps the org network — this adds the trust dimension on top of the people.)
 *
 * Per-user, Supabase-backed (orb_relationships) with an in-memory fallback. Never throws.
 */
import { supabase } from './supabase.js';

export type Rel = { name: string; delivered: number; missed: number };
const cache = new Map<string, Map<string, Rel>>();
function rmap(userId: string): Map<string, Rel> { let m = cache.get(userId); if (!m) { m = new Map(); cache.set(userId, m); } return m; }
const idOf = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');

const NAME = '([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)';
const DELIVERED = new RegExp(`\\b${NAME}\\s+(?:delivered|came through|followed through|nailed it|got it done|was reliable|pulled through|handled it|showed up|was on time)\\b`);
const MISSED = new RegExp(`\\b${NAME}\\s+(?:flaked|missed (?:it|the deadline)|dropped the ball|let me down|was late|didn'?t (?:deliver|show|follow through)|bailed|no[- ]?showed|fell through|ghosted me?|missed again)\\b`);
const PRONOUN = /^(he|she|they|we|it|you|i|the|this|that|everyone|nobody|someone)$/i;

/** Detect a reliability report about a named person ("Dana delivered", "John flaked"), or null. */
export function parseReliability(text: string): { name: string; kind: 'delivered' | 'missed' } | null {
  const t = text || '';
  let m = DELIVERED.exec(t);
  if (m && !PRONOUN.test(m[1])) return { name: m[1], kind: 'delivered' };
  m = MISSED.exec(t);
  if (m && !PRONOUN.test(m[1])) return { name: m[1], kind: 'missed' };
  return null;
}

async function load(userId: string): Promise<Map<string, Rel>> {
  const m = rmap(userId);
  if (m.size || !supabase) return m;
  try {
    const { data } = await supabase.from('orb_relationships').select('name,delivered,missed').eq('user_id', userId);
    for (const r of data ?? []) m.set(idOf(r.name), { name: r.name, delivered: r.delivered || 0, missed: r.missed || 0 });
  } catch { /* in-memory */ }
  return m;
}

export async function recordReliability(userId: string, name: string, kind: 'delivered' | 'missed'): Promise<void> {
  const id = idOf(name); if (id.length < 2) return;
  const m = await load(userId); const r = m.get(id) ?? { name, delivered: 0, missed: 0 };
  if (kind === 'delivered') r.delivered++; else r.missed++;
  m.set(id, r);
  if (supabase) { try { await supabase.from('orb_relationships').upsert({ user_id: userId, name: r.name, delivered: r.delivered, missed: r.missed }, { onConflict: 'user_id,name' }); } catch { /* in-memory */ } }
}

/** Laplace-smoothed reliability score 0..1 + a plain-language read. */
export function reliability(r: Rel): { score: number; label: string; n: number } {
  const n = r.delivered + r.missed;
  const score = (r.delivered + 1) / (n + 2);
  const label = n < 2 ? 'too early to say'
    : score >= 0.75 ? 'someone you can count on'
      : score >= 0.55 ? 'generally solid'
        : score >= 0.4 ? 'mixed — verify the important things'
          : 'unreliable so far — have a backup';
  return { score, label, n };
}

export async function reliabilityOf(userId: string, name: string): Promise<string> {
  const r = (await load(userId)).get(idOf(name));
  if (!r) return `I haven't tracked anything about ${name} yet — tell me when they deliver or drop the ball and I'll keep score.`;
  const { label } = reliability(r);
  return `${r.name}: ${label} (delivered ${r.delivered}, missed ${r.missed}).`;
}

export async function roster(userId: string): Promise<string> {
  const all = [...(await load(userId)).values()].map((r) => ({ r, ...reliability(r) })).filter((x) => x.n >= 2);
  if (!all.length) return "I don't have enough of a track record on people yet — tell me who delivers and who flakes, and I'll build the picture.";
  all.sort((a, b) => b.score - a.score);
  const top = all.slice(0, 5).map((x) => `• ${x.r.name} — ${x.label}`);
  return 'Who you can count on, most reliable first:\n' + top.join('\n');
}
