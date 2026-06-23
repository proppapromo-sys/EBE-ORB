/**
 * profileStore.ts — a user's traveler details (needed to actually book flights). Per-user, stored
 * in Supabase (orb_profiles) when configured, in-memory otherwise. Never throws.
 */
import { supabase } from './supabase.js';

export type Traveler = {
  given_name?: string; family_name?: string; born_on?: string;  // YYYY-MM-DD
  gender?: string; title?: string; email?: string; phone?: string;
};
const TABLE = 'orb_profiles';
const mem = new Map<string, Traveler>();
const FIELDS: (keyof Traveler)[] = ['given_name', 'family_name', 'born_on', 'gender', 'title', 'email', 'phone'];

export async function getTraveler(userId: string): Promise<Traveler> {
  if (mem.has(userId)) return mem.get(userId)!;
  if (supabase) {
    try {
      const { data } = await supabase.from(TABLE).select('*').eq('user_id', userId).maybeSingle();
      if (data) { const t: Traveler = {}; for (const f of FIELDS) (t as any)[f] = data[f] ?? undefined; mem.set(userId, t); return t; }
    } catch { /* fall through */ }
  }
  return {};
}

export async function setTraveler(userId: string, patch: Traveler): Promise<Traveler> {
  const cur = { ...(mem.get(userId) ?? {}), ...patch };
  mem.set(userId, cur);
  if (supabase) {
    try { await supabase.from(TABLE).upsert({ user_id: userId, ...cur, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }); }
    catch { /* keep in-memory */ }
  }
  return cur;
}

export function travelerComplete(t: Traveler): boolean {
  return Boolean(t.given_name && t.family_name && t.born_on && t.email && t.phone);
}
