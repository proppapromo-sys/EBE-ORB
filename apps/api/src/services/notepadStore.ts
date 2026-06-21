/**
 * notepadStore.ts — a per-owner scratchpad EBE keeps. Single autosaved doc per user.
 * Supabase (`orb_notepad`) when configured, process-memory otherwise.
 */
import { supabase } from './supabase.js';

const TABLE = 'orb_notepad';
const mem = new Map<string, { content: string; updatedAt: string }>();

export async function getNotepad(userKey: string): Promise<{ content: string; updatedAt: string | null }> {
  if (supabase) {
    const { data } = await supabase.from(TABLE).select('content, updated_at').eq('user_key', userKey).single();
    return { content: data?.content ?? '', updatedAt: data?.updated_at ?? null };
  }
  const m = mem.get(userKey);
  return { content: m?.content ?? '', updatedAt: m?.updatedAt ?? null };
}

export async function saveNotepad(userKey: string, content: string): Promise<{ content: string; updatedAt: string }> {
  const updatedAt = new Date().toISOString();
  if (supabase) {
    await supabase.from(TABLE).upsert({ user_key: userKey, content, updated_at: updatedAt }, { onConflict: 'user_key' });
    return { content, updatedAt };
  }
  mem.set(userKey, { content, updatedAt });
  return { content, updatedAt };
}

export const notepadDurable = Boolean(supabase);
