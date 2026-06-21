/**
 * memoryStore.ts — EBE's long-term memory.
 *
 * Facts, preferences, people, and projects EBE should remember across sessions. The top
 * memories are injected into the council so answers are personalized. Durable in Supabase
 * (`orb_memories`) when configured, process-memory otherwise.
 */
import { supabase } from './supabase.js';

export type MemoryType = 'fact' | 'preference' | 'person' | 'project' | 'note';
export type Memory = {
  id: string;
  userKey: string;
  type: MemoryType;
  title: string;
  content: string;
  importance: number; // 1..10
  metadata: Record<string, unknown>;
  createdAt: string;
};

const TABLE = 'orb_memories';
const mem: Memory[] = [];
const clampImp = (n: unknown) => Math.max(1, Math.min(10, Number(n) || 5));

function rowToMem(r: Record<string, unknown>): Memory {
  return {
    id: String(r.id), userKey: String(r.user_key), type: (r.type as MemoryType) ?? 'fact',
    title: String(r.title), content: String(r.content), importance: Number(r.importance) || 5,
    metadata: (r.metadata as Record<string, unknown>) ?? {}, createdAt: String(r.created_at)
  };
}

export async function remember(userKey: string, m: {
  type?: MemoryType; title: string; content: string; importance?: number; metadata?: Record<string, unknown>;
}): Promise<Memory> {
  const base = {
    user_key: userKey, type: m.type ?? 'fact', title: m.title, content: m.content,
    importance: clampImp(m.importance), metadata: m.metadata ?? {}
  };
  if (supabase) {
    const { data, error } = await supabase.from(TABLE).insert(base).select().single();
    if (error || !data) throw new Error(`remember failed: ${error?.message ?? 'no row'}`);
    return rowToMem(data);
  }
  const rec: Memory = {
    id: `mem_${Math.random().toString(36).slice(2, 10)}`, userKey, type: base.type, title: base.title,
    content: base.content, importance: base.importance, metadata: base.metadata, createdAt: new Date().toISOString()
  };
  mem.unshift(rec);
  return rec;
}

export async function listMemories(userKey: string, limit = 50): Promise<Memory[]> {
  if (supabase) {
    const { data } = await supabase.from(TABLE).select('*').eq('user_key', userKey)
      .order('importance', { ascending: false }).order('created_at', { ascending: false }).limit(limit);
    return (data ?? []).map(rowToMem);
  }
  return mem.filter((x) => x.userKey === userKey)
    .sort((a, b) => b.importance - a.importance).slice(0, limit);
}

/** Lightweight keyword recall — substring scoring over title+content, importance-weighted. */
export async function recall(userKey: string, query: string, limit = 5): Promise<Memory[]> {
  const all = await listMemories(userKey, 500);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return all.slice(0, limit);
  const scored = all.map((m) => {
    const hay = (m.title + ' ' + m.content).toLowerCase();
    const hits = terms.reduce((n, t) => n + (hay.includes(t) ? 1 : 0), 0);
    return { m, score: hits * 10 + m.importance };
  }).filter((x) => x.score > x.m.importance); // require at least one term hit
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.m);
}

export async function forget(userKey: string, id: string): Promise<boolean> {
  if (supabase) {
    const { error } = await supabase.from(TABLE).delete().eq('user_key', userKey).eq('id', id);
    return !error;
  }
  const i = mem.findIndex((x) => x.id === id && x.userKey === userKey);
  if (i >= 0) { mem.splice(i, 1); return true; }
  return false;
}

export const memoryDurable = Boolean(supabase);
