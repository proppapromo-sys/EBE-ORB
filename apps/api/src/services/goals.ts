/**
 * goals.ts — ORB's Attention & Goal engine. The leap from understanding information to understanding
 * people: ORB notices the intentions you state ("I need to call John"), tracks them as open
 * commitments, sees when you keep PUTTING something off, weighs how much it matters, and nudges you at
 * the right moment — the way a real chief of staff keeps you honest about what's slipping.
 *
 * Per-user, Supabase-backed (orb_goals) with an in-memory fallback. Never throws.
 */
import { supabase } from './supabase.js';

export type Goal = { id: string; action: string; importance: number; created: number; lastSeen: number; deferrals: number; done: boolean };

const cache = new Map<string, Map<string, Goal>>();
function gmap(userId: string): Map<string, Goal> { let m = cache.get(userId); if (!m) { m = new Map(); cache.set(userId, m); } return m; }

const INTENT = /\b(?:i (?:need|have|want|ought) to|i should|i've got to|i gotta|need to|don'?t let me forget to|i must|i really (?:need|have) to)\s+(.+)/i;
const DONE = /\b(?:i (?:just )?(?:called|phoned|sent|emailed|finished|did|handled|paid|booked|met with|talked to|spoke to|wrapped up|completed|took care of))\s+(.+)/i;
const STOP_TIME = /\b(today|tomorrow|tonight|this week|next week|later|soon|asap|right now|first thing|at \d.*|by \w+|on \w+day)\b.*$/i;
const QUESTION = /^(?:do|should|can|could|would|what|when|why|how|is|are|did)\b/i;

const HIGH = /\b(client|deadline|contract|urgent|important|asap|payroll|investor|lawsuit|board|tax|audit|closing|launch|payment|overdue|legal)\b/i;
const MED = /\b(meeting|email|proposal|call|pay|bill|review|follow ?up|send|schedule|book|reply|respond)\b/i;

function actionKey(action: string): string {
  return action.toLowerCase().replace(STOP_TIME, '').replace(/[^a-z0-9 ]/g, '')
    .replace(/\b(the|a|an|my|to|him|her|them|about|that|please|back|again)\b/g, ' ').replace(/\s+/g, ' ').trim();
}
function importanceOf(text: string): number { return HIGH.test(text) ? 3 : MED.test(text) ? 2 : 1; }

async function loadGoals(userId: string): Promise<Map<string, Goal>> {
  const m = gmap(userId);
  if (m.size || !supabase) return m;
  try {
    const { data } = await supabase.from('orb_goals').select('*').eq('user_id', userId);
    for (const r of data ?? []) m.set(r.id, { id: r.id, action: r.action, importance: r.importance, created: Date.parse(r.created) || Date.now(), lastSeen: Date.parse(r.last_seen) || Date.now(), deferrals: r.deferrals || 0, done: !!r.done });
  } catch { /* in-memory only */ }
  return m;
}
async function persist(userId: string, g: Goal): Promise<void> {
  if (!supabase) return;
  try { await supabase.from('orb_goals').upsert({ user_id: userId, id: g.id, action: g.action, importance: g.importance, created: new Date(g.created).toISOString(), last_seen: new Date(g.lastSeen).toISOString(), deferrals: g.deferrals, done: g.done }, { onConflict: 'user_id,id' }); }
  catch { /* keep in-memory */ }
}

/** Notice a stated intention. Returns the goal and whether it's a RE-mention (i.e. being put off). */
export async function noteIntent(userId: string, text: string): Promise<{ goal: Goal; deferred: boolean } | null> {
  const t = (text || '').trim();
  if (QUESTION.test(t) || /\?\s*$/.test(t)) return null;   // a question about doing X isn't a commitment
  const m = INTENT.exec(t);
  if (!m) return null;
  let action = m[1].trim().replace(/[.!?]+$/, '');
  action = action.replace(STOP_TIME, '').trim() || action;
  action = action.split(/[,;]| because | since | so (?:that|i)\b| - /i)[0].trim() || action;   // keep the core task, drop the aside
  const key = actionKey(action);
  if (key.length < 3) return null;
  const map = await loadGoals(userId); const now = Date.now();
  let g = map.get(key); let deferred = false;
  if (g && !g.done) { g.deferrals++; g.lastSeen = now; g.importance = Math.max(g.importance, importanceOf(t)); deferred = true; }
  else { g = { id: key, action, importance: importanceOf(t), created: now, lastSeen: now, deferrals: 0, done: false }; map.set(key, g); }
  await persist(userId, g);
  return { goal: g, deferred };
}

/** Close out a commitment the user reports finishing. */
export async function completeIntent(userId: string, text: string): Promise<Goal | null> {
  const m = DONE.exec(text || '');
  if (!m) return null;
  const key = actionKey(m[1]);
  if (key.length < 3) return null;
  const map = await loadGoals(userId);
  for (const g of map.values()) if (!g.done && (g.id.includes(key) || key.includes(g.id))) { g.done = true; await persist(userId, g); return g; }
  return null;
}

/** Attention = importance + how long it's aged + how often it's been put off. */
export function goalScore(g: Goal): number {
  const ageDays = (Date.now() - g.created) / 86400000;
  return g.importance * 2 + Math.min(14, ageDays) + g.deferrals * 3;
}

/** What's slipping, most pressing first. */
export async function pendingGoals(userId: string, n = 5): Promise<Goal[]> {
  const map = await loadGoals(userId);
  return [...map.values()].filter((g) => !g.done).sort((a, b) => goalScore(b) - goalScore(a)).slice(0, n);
}

/** A gentle behavioral nudge — only once something important has been put off a couple of times. */
export function nudgeFor(g: Goal): string | null {
  if (g.deferrals >= 2 && g.importance >= 2) {
    const days = Math.max(1, Math.round((Date.now() - g.created) / 86400000));
    return `You've brought up "${g.action}" ${g.deferrals + 1} times over ${days} day${days === 1 ? '' : 's'} — want me to block ten minutes for it, or knock it out now?`;
  }
  return null;
}

/** Execution stats for self-regulation: how much the user closes vs lets slip, and the avoided one. */
export async function goalStats(userId: string): Promise<{ done: number; open: number; deferred: number; avoided: string | null }> {
  const map = await loadGoals(userId);
  let done = 0, open = 0, deferred = 0, avoided: string | null = null, avoidScore = -1;
  for (const g of map.values()) {
    if (g.done) { done++; continue; }
    open++; deferred += g.deferrals;
    const score = g.importance * 2 + g.deferrals * 3;
    if (g.deferrals >= 1 && g.importance >= 2 && score > avoidScore) { avoidScore = score; avoided = g.action; }
  }
  return { done, open, deferred, avoided };
}

export function formatPending(goals: Goal[]): string {
  if (!goals.length) return "You're clear — nothing's slipping that I'm tracking.";
  return 'Here\'s what\'s been slipping, most pressing first:\n' +
    goals.map((g, i) => `${i + 1}. ${g.action}${g.deferrals ? ` (raised ${g.deferrals + 1}×)` : ''}${g.importance >= 3 ? ' — high impact' : ''}`).join('\n');
}
