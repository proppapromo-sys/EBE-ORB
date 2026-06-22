/**
 * platformKeys.ts — the AI brain keys (OpenAI / Anthropic / Gemini) the OWNER sets from inside
 * the app, so nobody has to edit files on a server. Values live in Supabase
 * (`orb_platform_settings`) when configured so they survive restarts, with an in-memory cache for
 * fast, synchronous reads. Reads fall back to environment variables, so existing .env setups keep
 * working. Secrets are never returned to the client — only a masked status.
 */
import { supabase } from './supabase.js';

const TABLE = 'orb_platform_settings';
const cache = new Map<string, string>(); // name -> value (runtime overrides)

/** The keys the owner can manage from Settings. */
export const PLATFORM_KEYS = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY'] as const;
export type PlatformKeyName = (typeof PLATFORM_KEYS)[number];

/** Load any saved keys into the cache at startup (best-effort). */
export async function loadPlatformKeys(): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.from(TABLE).select('name,value');
    for (const row of data ?? []) if (row.name && row.value) cache.set(String(row.name), String(row.value));
  } catch { /* table may not exist yet — env still works */ }
}

/** Resolve a key: runtime override first, then environment. */
export function getPlatformKey(name: string): string | undefined {
  return cache.get(name) ?? process.env[name] ?? undefined;
}

export async function setPlatformKey(name: PlatformKeyName, value: string): Promise<void> {
  cache.set(name, value);
  if (supabase) {
    try {
      await supabase.from(TABLE).upsert({ name, value, updated_at: new Date().toISOString() }, { onConflict: 'name' });
    } catch { /* keep the in-memory value even if persistence fails */ }
  }
}

export async function clearPlatformKey(name: PlatformKeyName): Promise<void> {
  cache.delete(name);
  if (supabase) { try { await supabase.from(TABLE).delete().eq('name', name); } catch { /* ignore */ } }
}

/** Safe status for the UI: which brains are on, and a masked hint — never the secret itself. */
export function platformKeyStatus(): { name: PlatformKeyName; set: boolean; source: 'app' | 'env' | 'none'; hint: string }[] {
  return PLATFORM_KEYS.map((name) => {
    const inApp = cache.has(name);
    const v = getPlatformKey(name);
    return {
      name,
      set: Boolean(v),
      source: inApp ? 'app' : v ? 'env' : 'none',
      hint: v ? `••••${v.slice(-4)}` : ''
    };
  });
}
