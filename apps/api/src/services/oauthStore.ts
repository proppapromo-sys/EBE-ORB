/**
 * oauthStore.ts — persisted OAuth tokens for live connectors.
 *
 * Durable in Supabase (`orb_oauth_tokens`) when configured, process-memory otherwise.
 * Keyed by (userKey, provider). Tokens are refreshed in place by the provider helpers.
 */
import { supabase } from './supabase.js';

export type OAuthToken = {
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  expiresAt?: number; // epoch ms
};

const TABLE = 'orb_oauth_tokens';
const mem = new Map<string, OAuthToken>(); // key: `${userKey}:${provider}`
const k = (u: string, p: string) => `${u}:${p}`;

export async function saveToken(userKey: string, provider: string, tok: OAuthToken): Promise<void> {
  if (supabase) {
    await supabase.from(TABLE).upsert(
      {
        user_key: userKey,
        provider,
        access_token: tok.accessToken,
        refresh_token: tok.refreshToken ?? null,
        scope: tok.scope ?? null,
        token_type: tok.tokenType ?? 'Bearer',
        expires_at: tok.expiresAt ?? null,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_key,provider' }
    );
    return;
  }
  mem.set(k(userKey, provider), tok);
}

export async function getToken(userKey: string, provider: string): Promise<OAuthToken | null> {
  if (supabase) {
    const { data } = await supabase.from(TABLE).select('*').eq('user_key', userKey).eq('provider', provider).single();
    if (!data) return null;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? undefined,
      scope: data.scope ?? undefined,
      tokenType: data.token_type ?? 'Bearer',
      expiresAt: data.expires_at ?? undefined
    };
  }
  return mem.get(k(userKey, provider)) ?? null;
}

export async function deleteToken(userKey: string, provider: string): Promise<void> {
  if (supabase) {
    await supabase.from(TABLE).delete().eq('user_key', userKey).eq('provider', provider);
    return;
  }
  mem.delete(k(userKey, provider));
}

export const oauthDurable = Boolean(supabase);
