/**
 * purpose.ts — ORB's Purpose, Meaning & Value Systems (#14): why any of this matters. Efficiency
 * without purpose just goes the wrong way faster. ORB holds the user's purpose/mission, and before it
 * recommends, it checks ALIGNMENT — does this serve the mission, the values, the goals? — flagging when
 * something is merely productive or profitable while pulling away from what actually matters.
 *
 * Purpose is stored (orb_purpose) with an in-memory fallback. Values live in wisdom.ts; goals in
 * objectives.ts — this layer aligns action to all three.
 */
import { supabase } from './supabase.js';
import { getValues } from './wisdom.js';
import { listObjectives } from './objectives.js';

const cache = new Map<string, string>();

export const PURPOSE_QUERY = /\bwhat'?s my (?:purpose|mission|why)\b|\bwhy (?:am i|are we) doing (?:this|all (?:of )?this|any of this)\b|\bwhat'?s the (?:point|bigger picture)\b/i;
export const ALIGN_QUERY = /\b(?:is (?:this|that|it)|does (?:this|that|it)) (?:really )?(?:aligned?|align)\b|\bdoes (?:this|that|it) (?:serve|fit|advance|move me toward) my (?:purpose|mission|values|goals)\b|\bam i (?:on|off) (?:purpose|mission|track with my (?:purpose|values))\b|\bis this worth (?:my time|doing)\b/i;

export const ALIGNMENT_DIRECTIVE = ' Before recommending, check alignment: does this serve the user\'s purpose/mission, their values, and their goals — or is it merely efficient or profitable while pulling away from what matters to them? If there is a misalignment or a values trade-off, name it plainly. Optimize for significance and long-term mission, not just productivity.';

export async function getPurpose(userId: string): Promise<string> {
  if (cache.has(userId)) return cache.get(userId)!;
  let v = '';
  if (supabase) { try { const { data } = await supabase.from('orb_purpose').select('purpose').eq('user_id', userId).maybeSingle(); if (data?.purpose) v = data.purpose; } catch { /* in-memory */ } }
  cache.set(userId, v); return v;
}
export async function setPurpose(userId: string, purpose: string): Promise<string> {
  const v = (purpose || '').slice(0, 240);
  cache.set(userId, v);
  if (supabase) { try { await supabase.from('orb_purpose').upsert({ user_id: userId, purpose: v, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }); } catch { /* in-memory */ } }
  return v;
}
export function parsePurpose(text: string): string | null {
  const m = /\b(?:my (?:purpose|mission|why|life'?s work) is|i'?m here to|i exist to|what i'?m really (?:building|doing|here for) is|i want to be remembered for|my north star is)\s+(.+)/i.exec(text || '');
  return m ? m[1].trim().replace(/^to\s+/i, '').replace(/[.!?]+$/, '').slice(0, 240) : null;
}

/** A context line aligning recommendations to the user's purpose, values, and top goal. */
export async function alignmentContext(userId: string): Promise<string> {
  const [purpose, values, objs] = await Promise.all([
    getPurpose(userId).catch(() => ''),
    getValues(userId).catch(() => ''),
    listObjectives(userId).catch(() => [])
  ]);
  const bits: string[] = [];
  if (purpose) bits.push(`purpose: ${purpose}`);
  if (values) bits.push(`values: ${values}`);
  if (objs.length) bits.push(`top goal: ${objs[0].label}`);
  if (!bits.length) return '';
  return `What gives the user's work meaning (align your recommendations to these; flag anything that pulls against them): ${bits.join('; ')}.`;
}
