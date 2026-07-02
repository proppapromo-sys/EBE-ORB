/**
 * integrations.ts — the catalog of business integrations a customer can self-connect, plus the
 * live "test the keys" and "read a signal" helpers for each.
 *
 * The catalog is what makes Settings feel "already set up for you": the UI renders each card and
 * its required fields straight from here. To add a new integration you add one entry + a small
 * test/read function — the Settings screen and the credential plumbing need no changes.
 */
import type { OrbDomain, OrbSignalInput } from '../types/orb.js';
import { getCredential, type Credential } from './credentialStore.js';

export type IntegrationField = {
  key: string;
  label: string;
  placeholder?: string;
  help?: string;
  optional?: boolean; // if true, the field can be left blank (e.g. a public health endpoint needs no token)
};

export type Integration = {
  provider: string;
  label: string;
  domain: OrbDomain;
  blurb: string;
  fields: IntegrationField[];
  docs?: string; // where the customer finds these keys
};

/** Everything a customer can connect from Settings. Order = display order. */
export const INTEGRATIONS: Integration[] = [
  {
    provider: 'shopify',
    label: 'Shopify',
    domain: 'commerce',
    blurb: 'Read your store — open orders and what needs attention.',
    docs: 'Shopify admin → Settings → Apps and sales channels → Develop apps → create an app → Admin API access token.',
    fields: [
      { key: 'shop', label: 'Store domain', placeholder: 'your-store.myshopify.com' },
      { key: 'token', label: 'Admin API access token', placeholder: 'shpat_…' }
    ]
  },
  {
    provider: 'stripe',
    label: 'Stripe',
    domain: 'commerce',
    blurb: 'Watch payments — disputes that need a response.',
    docs: 'Stripe Dashboard → Developers → API keys → Secret key (use a restricted key with read access).',
    fields: [{ key: 'secretKey', label: 'Secret key', placeholder: 'sk_live_… or rk_live_…' }]
  },
  {
    provider: 'custom',
    label: 'My App',
    domain: 'business',
    blurb: 'Connect a program you built — ORB pings its health endpoint and tells you when it goes down.',
    docs: 'Point ORB at any URL that returns 2xx when your app is healthy (a /health or /status endpoint is ideal). If it needs auth, add a bearer token.',
    fields: [
      { key: 'name', label: 'What to call it', placeholder: 'Booking service', optional: true, help: 'How ORB refers to this program in health reports.' },
      { key: 'url', label: 'Health-check URL', placeholder: 'https://myapp.example.com/health', help: 'ORB sends a GET here. 2xx = healthy, anything else = down.' },
      { key: 'apiKey', label: 'Bearer token (optional)', placeholder: 'leave blank if the endpoint is public', optional: true, help: 'Sent as Authorization: Bearer …' }
    ]
  }
];

export function getIntegration(provider: string): Integration | undefined {
  return INTEGRATIONS.find((i) => i.provider === provider);
}

/** Lightweight authenticated call to confirm the customer's keys actually work. */
export async function testConnection(provider: string, fields: Credential): Promise<{ ok: boolean; note: string }> {
  try {
    if (provider === 'shopify') {
      const shop = normShop(fields.shop);
      if (!shop || !fields.token) return { ok: false, note: 'Need both the store domain and an access token.' };
      const r = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: { 'X-Shopify-Access-Token': fields.token }
      });
      if (r.ok) return { ok: true, note: 'Shopify connected.' };
      if (r.status === 401 || r.status === 403) return { ok: false, note: 'Shopify rejected those keys (check the token + scopes).' };
      return { ok: false, note: `Shopify error ${r.status}.` };
    }
    if (provider === 'stripe') {
      if (!fields.secretKey) return { ok: false, note: 'Need your Stripe secret key.' };
      const r = await fetch('https://api.stripe.com/v1/balance', {
        headers: { authorization: `Bearer ${fields.secretKey}` }
      });
      if (r.ok) return { ok: true, note: 'Stripe connected.' };
      if (r.status === 401) return { ok: false, note: 'Stripe rejected that key.' };
      return { ok: false, note: `Stripe error ${r.status}.` };
    }
    if (provider === 'custom') {
      const url = normUrl(fields.url);
      if (!url) return { ok: false, note: 'Need the health-check URL (https://…).' };
      const who = fields.name?.trim() || 'Your app';
      const headers: Record<string, string> = { accept: '*/*' };
      if (fields.apiKey?.trim()) headers.authorization = `Bearer ${fields.apiKey.trim()}`;
      const r = await fetch(url, { method: 'GET', headers, redirect: 'follow' });
      if (r.ok) return { ok: true, note: `${who} responded ${r.status} — healthy.` };
      if (r.status === 401 || r.status === 403) return { ok: false, note: `${who} rejected the request (${r.status}) — check the token.` };
      return { ok: false, note: `${who} returned ${r.status} — not healthy.` };
    }
    return { ok: false, note: `No test wired for "${provider}".` };
  } catch (e) {
    return { ok: false, note: e instanceof Error ? e.message : 'connection test failed' };
  }
}

/** Live signals for a self-connected provider. Returns [] (not an error) when not connected. */
export async function liveSignals(provider: string, userId: string): Promise<OrbSignalInput[]> {
  const fields = await getCredential(userId, provider);
  if (!fields) return [];
  try {
    if (provider === 'shopify') return await shopifySignals(fields);
    if (provider === 'stripe') return await stripeSignals(fields);
  } catch {
    // a live read failing must never break the cycle
  }
  return [];
}

// ── provider reads ──────────────────────────────────────────────────────────
function normShop(shop?: string): string {
  if (!shop) return '';
  return shop.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
}

/** Accept only a real http(s) URL; return '' for anything else so we never fetch junk. */
function normUrl(raw?: string): string {
  if (!raw) return '';
  let s = raw.trim();
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
    return u.toString();
  } catch {
    return '';
  }
}

async function shopifySignals(f: Credential): Promise<OrbSignalInput[]> {
  const shop = normShop(f.shop);
  if (!shop || !f.token) return [];
  const r = await fetch(`https://${shop}/admin/api/2024-01/orders/count.json?status=open`, {
    headers: { 'X-Shopify-Access-Token': f.token }
  });
  if (!r.ok) return [];
  const d = (await r.json()) as { count?: number };
  const open = d.count ?? 0;
  if (open <= 0) return [];
  return [
    {
      id: 'shopify-open-orders',
      name: `${open} open order${open === 1 ? '' : 's'} on Shopify`,
      description: `You have ${open} open order${open === 1 ? '' : 's'} waiting to be fulfilled.`,
      domain: 'commerce',
      category: 'orders',
      riskLevel: 'low',
      urgency: Math.min(0.9, 0.4 + open * 0.02),
      impact: Math.min(0.8, 0.3 + open * 0.02),
      effort: 0.3,
      confidence: 0.9,
      toolName: 'shopify.fulfill'
    }
  ];
}

async function stripeSignals(f: Credential): Promise<OrbSignalInput[]> {
  if (!f.secretKey) return [];
  const r = await fetch('https://api.stripe.com/v1/disputes?limit=100', {
    headers: { authorization: `Bearer ${f.secretKey}` }
  });
  if (!r.ok) return [];
  const d = (await r.json()) as { data?: { status?: string }[] };
  const need = (d.data ?? []).filter((x) => x.status === 'needs_response').length;
  if (need <= 0) return [];
  return [
    {
      id: 'stripe-disputes',
      name: `${need} Stripe dispute${need === 1 ? '' : 's'} need a response`,
      description: `${need} payment dispute${need === 1 ? '' : 's'} will be lost if you don't respond in time.`,
      domain: 'commerce',
      category: 'finance',
      riskLevel: 'high',
      urgency: 0.9,
      impact: 0.8,
      effort: 0.4,
      confidence: 0.95,
      toolName: 'stripe.respondDispute'
    }
  ];
}
