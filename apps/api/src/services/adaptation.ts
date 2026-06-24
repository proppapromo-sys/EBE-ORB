/**
 * adaptation.ts — ORB's Adaptation & Learning (#8): growth itself. Intelligence isn't knowing
 * everything; it's learning faster than the environment changes. ORB records the outcomes of what the
 * user tries (wins and losses), learns which strategies actually produce results, and adapts what it
 * recommends — do more of what works, rethink what doesn't. A reinforcement loop: action → outcome →
 * feedback → adjustment.
 *
 * Per-user, Supabase-backed (orb_outcomes) with an in-memory fallback. Never throws.
 *
 * (Learning style and feedback preference already live in the personality/support layers — visual
 * tendency = visual learner; support style = direct/encouraging/reassuring feedback. This layer is the
 * outcome-feedback loop those don't cover.)
 */
import { supabase } from './supabase.js';

export type Outcome = 'win' | 'loss';
type Tally = { wins: number; losses: number };
const cache = new Map<string, Map<string, Tally>>();
function tmap(userId: string): Map<string, Tally> { let m = cache.get(userId); if (!m) { m = new Map(); cache.set(userId, m); } return m; }
const idOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\b(the|a|an|my|our|that|this)\b/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

const WIN = /\b(.+?)\s+(?:worked|was a (?:win|success|hit)|paid off|crushed it|went (?:great|well|smoothly)|killed it|nailed it|did great)\b/i;
const LOSS = /\b(.+?)\s+(?:didn'?t work|flopped|failed|was a (?:flop|bust|waste|disaster)|bombed|went (?:badly|poorly|nowhere)|backfired|fell flat|tanked)\b/i;
const STOP = /^(it|that|this|everything|nothing|things|what|nobody|no one)$/i;
const QUESTION = /^(what|why|how|did|does|is|are|will|should)\b/i;

function clean(s: string): string {
  const t = (s || '').trim().replace(/^(?:the|my|our|that|this|a|an)\s+/i, '').replace(/[.!?]+$/, '').trim();
  return (t.length >= 2 && t.length <= 60 && !STOP.test(t)) ? t : '';
}

/** Detect a reported outcome ("the Friday promo worked", "the new menu flopped"), or null. */
export function parseOutcome(text: string): { label: string; result: Outcome } | null {
  const t = (text || '').trim();
  if (QUESTION.test(t) || /\?\s*$/.test(t)) return null;   // a question, not a report
  let m: RegExpExecArray | null;
  if ((m = WIN.exec(t))) { const l = clean(m[1]); return l ? { label: l, result: 'win' } : null; }
  if ((m = LOSS.exec(t))) { const l = clean(m[1]); return l ? { label: l, result: 'loss' } : null; }
  return null;
}

async function load(userId: string): Promise<Map<string, Tally>> {
  const m = tmap(userId);
  if (m.size || !supabase) return m;
  try {
    const { data } = await supabase.from('orb_outcomes').select('label,wins,losses').eq('user_id', userId);
    for (const r of data ?? []) m.set(idOf(r.label), { wins: r.wins || 0, losses: r.losses || 0 });
  } catch { /* in-memory */ }
  return m;
}

export async function recordOutcome(userId: string, label: string, result: Outcome): Promise<void> {
  const id = idOf(label); if (id.length < 2) return;
  const m = await load(userId); const t = m.get(id) ?? { wins: 0, losses: 0 };
  if (result === 'win') t.wins++; else t.losses++;
  m.set(id, t);
  if (supabase) { try { await supabase.from('orb_outcomes').upsert({ user_id: userId, label, wins: t.wins, losses: t.losses }, { onConflict: 'user_id,label' }); } catch { /* in-memory */ } }
}

/** Pure: from outcome tallies, recommend what to do more of and what to rethink. Testable. */
export function recommendFrom(entries: [string, Tally][]): { keep: string[]; rethink: string[] } {
  const keep: string[] = [], rethink: string[] = [];
  for (const [label, t] of entries) {
    const total = t.wins + t.losses;
    if (total < 2) continue;
    const rate = t.wins / total;
    if (rate >= 0.66) keep.push(`${label} (${t.wins}/${total} worked)`);
    else if (rate <= 0.34) rethink.push(`${label} (${t.wins}/${total} worked)`);
  }
  return { keep, rethink };
}

export async function whatWorks(userId: string): Promise<{ keep: string[]; rethink: string[] }> {
  return recommendFrom([...(await load(userId)).entries()]);
}

export function formatAdaptation(r: { keep: string[]; rethink: string[] }): string {
  if (!r.keep.length && !r.rethink.length) return "I don't have enough outcomes logged yet to tell what's working — tell me how things turn out (\"the Friday promo worked\") and I'll learn the pattern.";
  const out: string[] = [];
  if (r.keep.length) out.push('**Do more of** (it keeps working):\n' + r.keep.map((k) => `• ${k}`).join('\n'));
  if (r.rethink.length) out.push('**Rethink** (it keeps falling flat):\n' + r.rethink.map((k) => `• ${k}`).join('\n'));
  return out.join('\n\n');
}
