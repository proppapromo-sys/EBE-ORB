import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Build the client only when BOTH values look real. A missing, placeholder, or malformed value
 * must never crash the whole server — persistence is optional, so on bad config we degrade to
 * in-memory mode (supabase = null) and log a warning instead of throwing at startup.
 */
function initSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  // Reject obvious placeholders (e.g. copied straight from .env.example).
  if (/your_|example|changeme|placeholder/i.test(url) || /your_|example|changeme|placeholder/i.test(key)) {
    console.warn('[supabase] SUPABASE_URL/KEY look like placeholders — running without persistence (in-memory mode).');
    return null;
  }
  // A valid Supabase URL must be a real http(s) URL; createClient throws otherwise.
  try {
    new URL(url);
  } catch {
    console.warn(`[supabase] SUPABASE_URL is not a valid URL ("${url}") — running without persistence (in-memory mode).`);
    return null;
  }
  try {
    return createClient(url, key);
  } catch (err) {
    console.warn('[supabase] createClient failed — running without persistence (in-memory mode):', err instanceof Error ? err.message : err);
    return null;
  }
}

export const supabase = initSupabase();

export function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  return supabase;
}
