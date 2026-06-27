/**
 * business.ts — ORB as the eyes and ears of your business. A per-user Business Brain: what the business
 * is, its priorities, the metrics that matter, and notes ORB learns over time. This is woven into every
 * chat turn so ORB answers with standing awareness of your business (smarter chat), and it powers the
 * "what do you see / what needs fixing" problem scan.
 *
 * Honest scope, consistent with ORB's five laws: ORB is your eyes and ears — it watches (connectors +
 * the proactive worker), learns the business, surfaces and diagnoses problems, and proposes fixes. It
 * does NOT silently act: anything that changes the world stays confirm-first, you decide. "Sees and
 * fixes all problems" means sees everything it's connected to and drives each fix with your OK — not
 * autonomous control.
 *
 * Per-user, Supabase-backed (orb_business) with an in-memory fallback. Never throws. parse* are pure/tested.
 */
import { supabase } from './supabase.js';

export type Business = { name: string; description: string; priorities: string[]; metrics: string[]; notes: string[]; updated: number };
const cache = new Map<string, Business>();
const blank = (): Business => ({ name: '', description: '', priorities: [], metrics: [], notes: [], updated: 0 });

function clip(s: string, n = 160): string { return s.trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, '').slice(0, n); }
function addUniq(arr: string[], v: string, max = 12): void { const c = clip(v); if (c && !arr.some((x) => x.toLowerCase() === c.toLowerCase())) { arr.push(c); if (arr.length > max) arr.shift(); } }

/** Pure: pull explicit business facts out of a message. High-precision (won't fire on normal chat). Tested. */
export function parseBusiness(text: string): Partial<Business> | null {
  const t = (text || '').trim();
  const out: Partial<Business> = {};
  let m: RegExpMatchArray | null;
  if ((m = t.match(/\b(?:my|our) (?:business|company|startup|firm|shop|store|brand) (?:is|does|sells?|makes?|provides?)\s+(.+)/i))) out.description = clip(m[1]);
  else if ((m = t.match(/\b(?:i|we) (?:run|own|operate|founded|started) (?:a |an |my |our )?(.+?(?:business|company|shop|store|brand|startup|agency|firm|restaurant|practice|service).*)/i))) out.description = clip(m[1]);
  if ((m = t.match(/\b(?:our|my|the) (?:top |main |#?1 )?priorit(?:y|ies) (?:is|are)\s+(.+)/i)) || (m = t.match(/\bwe(?:'re| are) (?:focused on|prioriti[sz]ing)\s+(.+)/i))) out.priorities = [clip(m[1])];
  if ((m = t.match(/\b(?:track|watch|monitor|our key metric is|the metric that matters is|kpi[:\s]+)\s*(.+)/i))) { const v = clip(m[1]); if (v.length <= 60) out.metrics = [v]; }
  if ((m = t.match(/\b(?:note (?:that |this )?about (?:the|my|our) business[,:]?|for the business,?|about (?:my|our) business[,:]?)\s+(.+)/i))) out.notes = [clip(m[1])];
  return Object.keys(out).length ? out : null;
}

async function load(userId: string): Promise<Business> {
  let b = cache.get(userId);
  if (b) return b;
  b = blank();
  if (supabase) {
    try {
      const { data } = await supabase.from('orb_business').select('name,description,priorities,metrics,notes,updated').eq('user_id', userId).maybeSingle();
      if (data) b = { name: data.name || '', description: data.description || '', priorities: data.priorities || [], metrics: data.metrics || [], notes: data.notes || [], updated: Date.parse(data.updated) || 0 };
    } catch { /* in-memory */ }
  }
  cache.set(userId, b);
  return b;
}

export async function getBusiness(userId: string): Promise<Business> { return load(userId); }

/** Merge in profile updates (priorities/metrics/notes append+dedupe; name/description overwrite). Never throws. */
export async function setBusiness(userId: string, patch: Partial<Business>): Promise<Business> {
  const b = await load(userId);
  if (patch.name) b.name = clip(patch.name, 80);
  if (patch.description) b.description = clip(patch.description, 240);
  for (const p of patch.priorities ?? []) addUniq(b.priorities, p);
  for (const mt of patch.metrics ?? []) addUniq(b.metrics, mt, 10);
  for (const n of patch.notes ?? []) addUniq(b.notes, n, 30);
  b.updated = Date.now();
  cache.set(userId, b);
  if (supabase) {
    try { await supabase.from('orb_business').upsert({ user_id: userId, name: b.name, description: b.description, priorities: b.priorities, metrics: b.metrics, notes: b.notes, updated: new Date(b.updated).toISOString() }, { onConflict: 'user_id' }); } catch { /* in-memory */ }
  }
  return b;
}

/** Pure: compact standing-context block for the chat, or '' when nothing is known yet. Tested. */
export function formatBusiness(b: Business): string {
  const parts: string[] = [];
  if (b.description) parts.push(`The business: ${b.description}.`);
  if (b.priorities.length) parts.push(`Priorities: ${b.priorities.join('; ')}.`);
  if (b.metrics.length) parts.push(`Metrics that matter: ${b.metrics.join('; ')}.`);
  if (b.notes.length) parts.push(`Notes: ${b.notes.slice(-6).join('; ')}.`);
  return parts.length ? `What I know about ${b.name || 'your business'} (you are the decision-maker; I watch and advise):\n${parts.join('\n')}` : '';
}

/** Standing business context for every chat turn — what makes ORB answer like it's been watching. */
export async function businessContext(userId: string): Promise<string> {
  return formatBusiness(await load(userId).catch(() => blank()));
}

// ORB's eyes-and-ears identity — stated when asked who/what it is, and as a quiet posture line.
export const EYES_AND_EARS = "I'm your eyes and ears across your business: I watch what you connect me to, learn how it runs, flag problems early, and bring you fixes — but anything that changes the world I run by you first. You stay the decision-maker.";

export const EYES_DIRECTIVE = ' Answer as this person\'s eyes and ears for their business: stay aware of what you know about it (above), connect the question to their priorities and the problems currently in view, and be proactive — if something looks wrong, broken, or slipping, name it and propose the fix. Anything that changes the world (sends, spends, posts, deletes, commits) stays confirm-first: propose it and wait for their go. Be the operator who notices, not just the assistant who answers.';

// "what do you see / what's wrong / what needs fixing / any problems / audit my business"
export const PROBLEMS_QUERY = /\b(what (?:do you see|are you seeing|needs (?:fixing|my attention|attention|to be fixed)|should i (?:fix|worry about|look at))|what'?s (?:wrong|broken|off|slipping|the problem|going wrong)|any (?:problems?|issues?|red flags?|fires?)|spot (?:any )?(?:problems?|issues?)|audit (?:my|the) (?:business|operation)|where are the problems|what (?:problems|issues) (?:do you see|are there)|is anything (?:wrong|broken|on fire))\b/i;
