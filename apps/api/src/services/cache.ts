/**
 * cache.ts — reuse previous answers. A tiny TTL cache so identical, stable questions return
 * instantly instead of hitting a model again. Only STABLE answers are cached (never live/personal
 * data like weather, calendar, or email — the caller decides), so nothing goes stale dangerously.
 */
type Entry = { v: string; exp: number };
const store = new Map<string, Entry>();
const TTL = Number(process.env.ORB_CACHE_TTL_MS || 600_000); // 10 minutes
const MAX = 500;

export function cacheGet(key: string): string | null {
  const e = store.get(key);
  if (!e) return null;
  if (e.exp < Date.now()) { store.delete(key); return null; }
  // refresh recency (simple LRU-ish)
  store.delete(key); store.set(key, e);
  return e.v;
}

export function cacheSet(key: string, v: string): void {
  if (store.size >= MAX) { const oldest = store.keys().next().value; if (oldest) store.delete(oldest); }
  store.set(key, { v, exp: Date.now() + TTL });
}
