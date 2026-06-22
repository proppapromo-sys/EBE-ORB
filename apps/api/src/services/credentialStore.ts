/**
 * credentialStore.ts — per-customer business API keys (Shopify, Stripe, …).
 *
 * This is how a customer connects THEIR OWN business: they paste their keys in Settings, we
 * store them per user, and the matching connector reads their live data. Durable in Supabase
 * (`orb_credentials`) when configured, process-memory otherwise. Keyed by (userKey, provider).
 *
 * Security: values are secrets. We never log them and never return them in full to the client —
 * the API only ever exposes a masked preview (last 4 chars) + a connected boolean.
 */
import { supabase } from './supabase.js';

export type Credential = Record<string, string>; // field name -> value (e.g. { token: 'shpat_...' })

const TABLE = 'orb_credentials';
const mem = new Map<string, Credential>(); // key: `${userKey}:${provider}`
const k = (u: string, p: string) => `${u}:${p}`;

export async function saveCredential(userKey: string, provider: string, fields: Credential): Promise<void> {
  if (supabase) {
    await supabase.from(TABLE).upsert(
      { user_key: userKey, provider, fields, updated_at: new Date().toISOString() },
      { onConflict: 'user_key,provider' }
    );
    return;
  }
  mem.set(k(userKey, provider), fields);
}

export async function getCredential(userKey: string, provider: string): Promise<Credential | null> {
  if (supabase) {
    const { data } = await supabase.from(TABLE).select('fields').eq('user_key', userKey).eq('provider', provider).single();
    return (data?.fields as Credential) ?? null;
  }
  return mem.get(k(userKey, provider)) ?? null;
}

export async function deleteCredential(userKey: string, provider: string): Promise<void> {
  if (supabase) { await supabase.from(TABLE).delete().eq('user_key', userKey).eq('provider', provider); return; }
  mem.delete(k(userKey, provider));
}

export async function clearUserCredentials(userKey: string): Promise<void> {
  if (supabase) { await supabase.from(TABLE).delete().eq('user_key', userKey); return; }
  for (const key of [...mem.keys()]) if (key.startsWith(userKey + ':')) mem.delete(key);
}

/** A safe-to-show preview of a stored secret: never the value, just last 4 chars. */
export function maskValue(v: string): string {
  if (!v) return '';
  const tail = v.slice(-4);
  return `••••${tail}`;
}

export const credentialsDurable = Boolean(supabase);
