/**
 * convoPrefs.ts — Adaptive Conversation Memory. Learns *how* a user likes to talk with ORB (not
 * what they say privately): preferred answer length and their natural pause before finishing a
 * thought. Per-user, Supabase-backed (orb_convo_prefs) with an in-memory fallback. Never throws.
 *
 * Privacy: this stores small preference signals only — no raw audio, no transcripts of background
 * speech. ORB only ever receives the finished text the user chose to send.
 */
import { supabase } from './supabase.js';

export type ConvoStyle = 'short' | 'detailed';
export type ConvoPrefs = { style: ConvoStyle; pauseMs: number };
const DEFAULTS: ConvoPrefs = { style: 'short', pauseMs: 1600 };

const TABLE = 'orb_convo_prefs';
const cache = new Map<string, ConvoPrefs>();

export async function getPrefs(userId: string): Promise<ConvoPrefs> {
  if (cache.has(userId)) return cache.get(userId)!;
  if (supabase) {
    try {
      const { data } = await supabase.from(TABLE).select('style,pause_ms').eq('user_id', userId).maybeSingle();
      if (data) { const p: ConvoPrefs = { style: data.style === 'detailed' ? 'detailed' : 'short', pauseMs: Number(data.pause_ms) || DEFAULTS.pauseMs }; cache.set(userId, p); return p; }
    } catch { /* fall back */ }
  }
  return { ...DEFAULTS };
}

export async function getStyle(userId: string): Promise<ConvoStyle> {
  return (await getPrefs(userId)).style;
}

export async function setPrefs(userId: string, patch: Partial<ConvoPrefs>): Promise<ConvoPrefs> {
  const cur = { ...(cache.get(userId) ?? DEFAULTS), ...patch };
  cur.pauseMs = Math.max(800, Math.min(3000, cur.pauseMs));   // keep it sane
  cache.set(userId, cur);
  if (supabase) {
    try { await supabase.from(TABLE).upsert({ user_id: userId, style: cur.style, pause_ms: cur.pauseMs, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }); }
    catch { /* keep in-memory */ }
  }
  return cur;
}
