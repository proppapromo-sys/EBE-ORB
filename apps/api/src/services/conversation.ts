/**
 * conversation.ts — ORB's running transcript. Every exchange (what you typed, what ORB answered) is
 * appended here so the whole conversation is stored and viewable, and so "save this conversation in my
 * notepad" can write the complete back-and-forth into the notepad.
 *
 * Per-user, Supabase-backed (orb_conversation) with an in-memory fallback. Never throws. Capped so the
 * log can't grow without bound.
 */
import { supabase } from './supabase.js';

export type Turn = { role: 'user' | 'orb'; text: string; at: number };
const cache = new Map<string, Turn[]>();
const MAX = 1000;
function tlist(userId: string): Turn[] { let a = cache.get(userId); if (!a) { a = []; cache.set(userId, a); } return a; }

/** Append one turn (a user message or an ORB answer). Never throws; empty text is ignored. */
export async function appendTurn(userId: string, role: Turn['role'], text: string): Promise<void> {
  const clean = (text || '').trim();
  if (!clean) return;
  const t: Turn = { role, text: clean.slice(0, 8000), at: Date.now() };
  const a = tlist(userId); a.push(t); if (a.length > MAX) a.splice(0, a.length - MAX);
  if (supabase) { try { await supabase.from('orb_conversation').insert({ user_id: userId, role: t.role, text: t.text, at: new Date(t.at).toISOString() }); } catch { /* in-memory */ } }
}

/** The conversation so far (oldest→newest), most recent `n` turns. Loads from Supabase on first read. */
export async function getConversation(userId: string, n = 400): Promise<Turn[]> {
  const a = tlist(userId);
  if (!a.length && supabase) {
    try {
      const { data } = await supabase.from('orb_conversation').select('role,text,at').eq('user_id', userId).order('at', { ascending: false }).limit(MAX);
      for (const r of (data ?? []).reverse()) a.push({ role: r.role, text: r.text, at: Date.parse(r.at) || Date.now() });
    } catch { /* in-memory */ }
  }
  return a.slice(-n);
}

/** Plain-text transcript of the conversation — what gets written into the notepad. */
export function formatTranscript(turns: Turn[]): string {
  if (!turns.length) return '(no conversation yet)';
  return turns.map((t) => `${t.role === 'user' ? 'You' : 'ORB'}: ${t.text}`).join('\n\n');
}

/** Wipe the conversation for a user (in-memory + Supabase). Never throws. The notepad copy, if saved, stays. */
export async function clearConversation(userId: string): Promise<void> {
  cache.set(userId, []);
  if (supabase) { try { await supabase.from('orb_conversation').delete().eq('user_id', userId); } catch { /* in-memory */ } }
}

// "save this conversation in/to my notepad", "save our chat", "save the conversation", etc.
export const SAVE_CONVO_RE = /\b(save (?:this|our|the|my) (?:conversation|chat|convo|transcript|discussion)|save (?:this|it) (?:in|to)(?: my)? notepad|(?:add|put|log) (?:this|our|the) (?:conversation|chat) (?:in|to)(?: my)? note|keep a (?:copy|record) of (?:this|our) (?:conversation|chat))\b/i;
