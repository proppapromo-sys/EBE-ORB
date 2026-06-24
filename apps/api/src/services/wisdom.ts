/**
 * wisdom.ts — ORB's Wisdom & Judgment (#10): knowing what SHOULD be done. Knowledge says what's true;
 * wisdom says what matters. Beyond feasibility, ORB weighs major decisions through second-order
 * consequences, trade-offs and opportunity cost, ethics, long-term impact, and the user's own values —
 * then recommends with calibrated confidence, honest about what it doesn't know.
 *
 * Per-user values are stored (orb_values) with an in-memory fallback. Never throws.
 */
import { supabase } from './supabase.js';

const valuesCache = new Map<string, string>();

// A weighty, consequential decision — where judgment matters more than a quick answer.
export const STRATEGIC = /\bshould (?:i|we)\b[^?]*\b(launch|expand|hire|fire|lay off|invest|raise|buy|sell|acquire|partner|quit|leave|relocate|open|shut|close|merge|pivot|borrow|sign|commit|go all in|double down|take on)\b|\b(big|major|life|huge|hard) (?:decision|move|bet|call)\b|\bbet the (?:house|company|farm)\b|\bis (?:it|this) (?:wise|the right (?:thing|move|call)|worth it)\b/i;
export function isStrategic(text: string): boolean { return STRATEGIC.test(text || ''); }

export const WISDOM_DIRECTIVE = ' Bring judgment, not just feasibility — the question is "should I", not only "can I". Think second-order (the consequence of the consequence), name the real trade-off (what is gained vs what is sacrificed) and the opportunity cost; check it is legal, ethical, sustainable, and something they would defend publicly; weigh long-term over short-term and consider how others would see it. Then give a clear recommendation with calibrated confidence, and say plainly what you are uncertain about — wisdom includes knowing what you do not know.';

export async function getValues(userId: string): Promise<string> {
  if (valuesCache.has(userId)) return valuesCache.get(userId)!;
  let v = '';
  if (supabase) { try { const { data } = await supabase.from('orb_values').select('values').eq('user_id', userId).maybeSingle(); if (data?.values) v = data.values; } catch { /* in-memory */ } }
  valuesCache.set(userId, v); return v;
}
export async function setValues(userId: string, values: string): Promise<string> {
  const v = (values || '').slice(0, 200);
  valuesCache.set(userId, v);
  if (supabase) { try { await supabase.from('orb_values').upsert({ user_id: userId, values: v, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }); } catch { /* in-memory */ } }
  return v;
}
export function parseValues(text: string): string | null {
  const m = /\b(?:my values are|my core values are|what matters (?:most )?to me is|i value|i care most about|my principles are|i stand for)\s+(.+)/i.exec(text || '');
  return m ? m[1].trim().replace(/[.!?]+$/, '').slice(0, 200) : null;
}
export function valuesDirective(values: string): string {
  return values ? ` Weigh this against the user's stated values: ${values}.` : '';
}
