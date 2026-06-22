/**
 * referrals.ts — who invited whom (the referral system's integrity layer). Records each invite,
 * counts conversions per inviter. Supabase-backed when configured, in-memory otherwise. Never throws.
 */
import { supabase } from './supabase.js';

const TABLE = 'orb_referrals';
const mem = new Map<string, { inviter: string; at: string }>(); // invitee -> who invited them

/** Record that `invitee` joined via `inviter`'s link. One referrer per invitee (first one wins). */
export async function recordReferral(invitee: string, inviter: string): Promise<void> {
  if (!invitee || !inviter || invitee === inviter || mem.has(invitee)) return;
  const at = new Date().toISOString();
  mem.set(invitee, { inviter, at });
  if (supabase) {
    try { await supabase.from(TABLE).upsert({ invitee, inviter, created_at: at }, { onConflict: 'invitee' }); }
    catch { /* keep the in-memory record */ }
  }
}

/** Conversion counts: total invites + how many each inviter brought in. */
export async function referralStats(): Promise<{ total: number; byInviter: Record<string, number> }> {
  const by: Record<string, number> = {};
  if (supabase) {
    try {
      const { data } = await supabase.from(TABLE).select('inviter');
      if (data) { for (const r of data) by[String(r.inviter)] = (by[String(r.inviter)] || 0) + 1; return { total: data.length, byInviter: by }; }
    } catch { /* fall back to memory */ }
  }
  for (const { inviter } of mem.values()) by[inviter] = (by[inviter] || 0) + 1;
  return { total: mem.size, byInviter: by };
}
