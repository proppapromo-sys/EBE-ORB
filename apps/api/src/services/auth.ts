/**
 * auth.ts — sign-in methods beyond Google/email: Apple Sign-In and phone (SMS one-time code).
 * Both read credentials live from owner settings/env, and degrade gracefully when not configured.
 * Portable: no framework assumptions, just functions the routes call.
 *
 *  Apple  → verify the identity token Apple returns (RS256 against Apple's public keys).
 *  Phone  → send a 6-digit code via Twilio, then verify it.
 */
import crypto from 'node:crypto';
import { getPlatformKey } from './platformKeys.js';

// ── Apple Sign-In ───────────────────────────────────────────────────────────
type Jwk = { kid: string; n: string; e: string; kty: string; alg?: string };
let appleKeys: { at: number; keys: Jwk[] } = { at: 0, keys: [] };

async function appleJwks(): Promise<Jwk[]> {
  if (Date.now() - appleKeys.at < 3600_000 && appleKeys.keys.length) return appleKeys.keys;
  const r = await fetch('https://appleid.apple.com/auth/keys');
  const d = (await r.json()) as { keys: Jwk[] };
  appleKeys = { at: Date.now(), keys: d.keys || [] };
  return appleKeys.keys;
}

const b64urlJson = (s: string) => JSON.parse(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));

/** Verify an Apple identity token and return the user's email + stable id. Throws if invalid. */
export async function verifyAppleToken(idToken: string): Promise<{ email?: string; sub: string }> {
  const [h, p, s] = (idToken || '').split('.');
  if (!h || !p || !s) throw new Error('malformed apple token');
  const header = b64urlJson(h) as { kid: string; alg: string };
  const payload = b64urlJson(p) as { iss: string; aud: string; exp: number; sub: string; email?: string };
  const jwk = (await appleJwks()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('apple key not found');
  const pub = crypto.createPublicKey({ key: jwk as unknown as crypto.JsonWebKeyInput['key'], format: 'jwk' });
  const ok = crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), pub, Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64'));
  if (!ok) throw new Error('apple signature invalid');
  if (payload.iss !== 'https://appleid.apple.com') throw new Error('bad issuer');
  const aud = getPlatformKey('APPLE_CLIENT_ID');
  if (aud && payload.aud !== aud) throw new Error('bad audience');
  if (payload.exp * 1000 < Date.now()) throw new Error('apple token expired');
  return { email: payload.email, sub: payload.sub };
}

export function appleConfigured(): boolean {
  return Boolean(getPlatformKey('APPLE_CLIENT_ID'));
}

// ── Phone (SMS one-time code via Twilio) ────────────────────────────────────
const codes = new Map<string, { code: string; exp: number }>();
const gen = () => String(Math.floor(100000 + Math.random() * 900000));

// SMS abuse guard: cap codes per number so nobody can run up the Twilio bill.
const sends = new Map<string, number[]>();
const MAX_PER_HOUR = Number(process.env.ORB_SMS_MAX_PER_HOUR || 5);
function rateLimited(phone: string): boolean {
  const now = Date.now();
  const hist = (sends.get(phone) || []).filter((t) => now - t < 3600_000);
  if (hist.length >= MAX_PER_HOUR) { sends.set(phone, hist); return true; }
  hist.push(now); sends.set(phone, hist);
  return false;
}

export function phoneConfigured(): boolean {
  return Boolean(getPlatformKey('TWILIO_ACCOUNT_SID') && getPlatformKey('TWILIO_AUTH_TOKEN') && getPlatformKey('TWILIO_FROM'));
}

/** Send a 6-digit code to a phone number. */
export async function startPhone(phone: string): Promise<{ sent: boolean; note?: string }> {
  const sid = getPlatformKey('TWILIO_ACCOUNT_SID'), token = getPlatformKey('TWILIO_AUTH_TOKEN'), from = getPlatformKey('TWILIO_FROM');
  if (!sid || !token || !from) return { sent: false, note: 'Phone sign-in not configured (set TWILIO_* keys).' };
  if (!/^\+?[1-9]\d{6,15}$/.test(phone)) return { sent: false, note: 'Enter a valid phone number with country code.' };
  if (rateLimited(phone)) return { sent: false, note: 'Too many codes requested — try again later.' };
  const code = gen();
  codes.set(phone, { code, exp: Date.now() + 5 * 60_000 });
  try {
    const body = new URLSearchParams({ To: phone, From: from, Body: `Your ORB code is ${code}` });
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' },
      body
    });
    if (!r.ok) return { sent: false, note: `twilio ${r.status}: ${(await r.text()).slice(0, 160)}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, note: e instanceof Error ? e.message : 'sms error' };
  }
}

/** Check a phone code. Returns a user id (the phone) on success. */
export function verifyPhone(phone: string, code: string): { ok: boolean; userId?: string; note?: string } {
  const rec = codes.get(phone);
  if (!rec || rec.exp < Date.now()) return { ok: false, note: 'code expired — request a new one' };
  if (rec.code !== String(code).trim()) return { ok: false, note: 'wrong code' };
  codes.delete(phone);
  return { ok: true, userId: phone };
}
