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

/** The AI brain keys (kept for back-compat). */
export const PLATFORM_KEYS = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY'] as const;
export type PlatformKeyName = (typeof PLATFORM_KEYS)[number];

/** Everything the OWNER may set from inside the app (grouped for the Keys panel). */
export const OWNER_KEY_GROUPS: Record<string, string[]> = {
  brains: ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY'],
  billing: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'PUBLIC_BASE_URL', 'ORB_TRIAL_DAYS',
            'STRIPE_PRICE_PERSONAL', 'STRIPE_PRICE_PRO', 'STRIPE_PRICE_ENTREPRENEUR', 'STRIPE_PRICE_EXECUTIVE', 'STRIPE_PRICE_ENTERPRISE',
            'STRIPE_PRICE_PERSONAL_ANNUAL', 'STRIPE_PRICE_PRO_ANNUAL', 'STRIPE_PRICE_ENTREPRENEUR_ANNUAL', 'STRIPE_PRICE_EXECUTIVE_ANNUAL', 'STRIPE_PRICE_ENTERPRISE_ANNUAL'],
  voice: ['ELEVENLABS_API_KEY', 'ELEVENLABS_VOICE_ID', 'ORB_VOICE_ENGINE_URL'],
  video: ['RUNWAY_API_KEY', 'ORB_VIDEO_PROVIDER'],
  auth: ['APPLE_CLIENT_ID', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM'],
  whatsapp: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_ID', 'WHATSAPP_VERIFY_TOKEN', 'TWILIO_WHATSAPP_FROM'],
  persistence: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
};
export const OWNER_KEYS: string[] = Object.values(OWNER_KEY_GROUPS).flat();
const isOwnerKey = (name: string) => OWNER_KEYS.includes(name);

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

export async function setPlatformKey(name: string, value: string): Promise<void> {
  if (!isOwnerKey(name)) throw new Error(`not an owner-settable key: ${name}`);
  cache.set(name, value);
  if (supabase) {
    try {
      await supabase.from(TABLE).upsert({ name, value, updated_at: new Date().toISOString() }, { onConflict: 'name' });
    } catch { /* keep the in-memory value even if persistence fails */ }
  }
}

export async function clearPlatformKey(name: string): Promise<void> {
  cache.delete(name);
  if (supabase) { try { await supabase.from(TABLE).delete().eq('name', name); } catch { /* ignore */ } }
}

type KeyStatus = { name: string; set: boolean; source: 'app' | 'env' | 'none'; hint: string };
function statusOf(name: string): KeyStatus {
  const inApp = cache.has(name);
  const v = getPlatformKey(name);
  const secret = !/^(PUBLIC_BASE_URL|ORB_VIDEO_PROVIDER|ORB_TRIAL_DAYS|ELEVENLABS_VOICE_ID|ORB_VOICE_ENGINE_URL)$/.test(name);
  return { name, set: Boolean(v), source: inApp ? 'app' : v ? 'env' : 'none', hint: v ? (secret ? `••••${v.slice(-4)}` : v) : '' };
}

/** Safe status for the AI brains (back-compat). */
export function platformKeyStatus(): KeyStatus[] {
  return PLATFORM_KEYS.map(statusOf);
}

/** Safe status for every owner key, grouped — never returns the secret itself. */
export function ownerKeyStatus(): Record<string, KeyStatus[]> {
  const out: Record<string, KeyStatus[]> = {};
  for (const [group, names] of Object.entries(OWNER_KEY_GROUPS)) out[group] = names.map(statusOf);
  return out;
}
