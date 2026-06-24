/**
 * google.ts — Google OAuth2 (authorization-code) + minimal Gmail/Calendar reads.
 *
 * Drives the live side of the Gmail and Calendar connectors. Everything degrades gracefully:
 * with no client credentials configured, isConfigured() is false and the connectors fall back
 * to sample signals. Tokens are persisted via oauthStore and auto-refreshed before use.
 */
import 'dotenv/config';
import { getToken, saveToken, type OAuthToken } from '../services/oauthStore.js';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:8080/api/orb/oauth/google/callback';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.events',   // read + create/update events
  'https://www.googleapis.com/auth/drive.metadata.readonly'  // search file names
];

export function isConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

/** The consent URL to send the user to. `state` carries the userKey (signed/opaque is fine here). */
export function buildAuthUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: GOOGLE_SCOPES.join(' '),
    state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

/** Exchange an authorization code for tokens and persist them for the user. */
export async function exchangeCode(userKey: string, code: string): Promise<OAuthToken> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  if (!res.ok) throw new Error(`google token exchange ${res.status}: ${await res.text()}`);
  const d = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number; scope?: string; token_type?: string };
  const tok: OAuthToken = {
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    scope: d.scope,
    tokenType: d.token_type ?? 'Bearer',
    expiresAt: Date.now() + (d.expires_in ?? 3600) * 1000
  };
  await saveToken(userKey, 'google', tok);
  return tok;
}

/** Return a non-expired access token, refreshing if needed. Null if the user hasn't connected. */
export async function getAccessToken(userKey: string): Promise<string | null> {
  const tok = await getToken(userKey, 'google');
  if (!tok) return null;
  if (tok.expiresAt && tok.expiresAt - Date.now() > 60_000) return tok.accessToken;
  if (!tok.refreshToken || !isConfigured()) return tok.accessToken; // can't refresh; try as-is
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: tok.refreshToken,
      grant_type: 'refresh_token'
    })
  });
  if (!res.ok) return tok.accessToken;
  const d = (await res.json()) as { access_token: string; expires_in?: number };
  const next: OAuthToken = { ...tok, accessToken: d.access_token, expiresAt: Date.now() + (d.expires_in ?? 3600) * 1000 };
  await saveToken(userKey, 'google', next);
  return next.accessToken;
}

async function gget(url: string, token: string): Promise<unknown> {
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`google api ${res.status}`);
  return res.json();
}

/** Count of unread, important inbox messages (for a Gmail signal). */
export async function gmailUnreadImportant(token: string): Promise<number> {
  const d = (await gget(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread%20is:important&maxResults=50',
    token
  )) as { resultSizeEstimate?: number; messages?: unknown[] };
  return d.messages?.length ?? d.resultSizeEstimate ?? 0;
}

/** Today's upcoming events (for a Calendar signal). */
export async function calendarToday(token: string): Promise<{ summary: string; start?: string }[]> {
  const now = new Date();
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime` +
    `&timeMin=${encodeURIComponent(now.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}&maxResults=10`;
  const d = (await gget(url, token)) as { items?: { summary?: string; start?: { dateTime?: string; date?: string } }[] };
  return (d.items ?? []).map((e) => ({ summary: e.summary ?? '(no title)', start: e.start?.dateTime ?? e.start?.date }));
}

/** Search the user's Google Drive by file name. */
export async function driveSearch(token: string, query: string): Promise<{ name: string; link?: string; type?: string }[]> {
  const q = encodeURIComponent(`name contains '${query.replace(/'/g, '')}' and trashed=false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=5&fields=files(name,webViewLink,mimeType,modifiedTime)&orderBy=modifiedTime desc`;
  const d = (await gget(url, token)) as { files?: { name?: string; webViewLink?: string; mimeType?: string }[] };
  return (d.files ?? []).map((f) => ({ name: f.name ?? '(untitled)', link: f.webViewLink, type: f.mimeType }));
}

/** Recently-modified Drive files (for mapping documents into the knowledge graph). */
export async function driveRecent(token: string): Promise<{ name: string; link?: string; type?: string }[]> {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent('trashed=false')}&pageSize=10&fields=files(name,webViewLink,mimeType)&orderBy=modifiedTime desc`;
  const d = (await gget(url, token)) as { files?: { name?: string; webViewLink?: string; mimeType?: string }[] };
  return (d.files ?? []).map((f) => ({ name: f.name ?? '(untitled)', link: f.webViewLink, type: f.mimeType }));
}

/** Recent inbox messages' sender + subject (for mapping people/topics into the knowledge graph). */
export async function gmailRecent(token: string): Promise<{ from: string; subject: string }[]> {
  const list = (await gget('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=in:inbox', token)) as { messages?: { id: string }[] };
  const out: { from: string; subject: string }[] = [];
  for (const m of (list.messages ?? []).slice(0, 10)) {
    try {
      const msg = (await gget(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`, token)) as { payload?: { headers?: { name: string; value: string }[] } };
      const hs = msg.payload?.headers ?? [];
      const from = hs.find((h) => h.name === 'From')?.value ?? '';
      const subject = hs.find((h) => h.name === 'Subject')?.value ?? '';
      if (from || subject) out.push({ from, subject });
    } catch { /* skip this message */ }
  }
  return out;
}

/** Upcoming events over the next `days` (default 2 → today + tomorrow). */
export async function calendarUpcoming(token: string, days = 2): Promise<{ summary: string; start?: string }[]> {
  const now = new Date();
  const end = new Date(now); end.setDate(end.getDate() + days); end.setHours(23, 59, 59, 999);
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime` +
    `&timeMin=${encodeURIComponent(now.toISOString())}&timeMax=${encodeURIComponent(end.toISOString())}&maxResults=15`;
  const d = (await gget(url, token)) as { items?: { summary?: string; start?: { dateTime?: string; date?: string } }[] };
  return (d.items ?? []).map((e) => ({ summary: e.summary ?? '(no title)', start: e.start?.dateTime ?? e.start?.date }));
}

/** Create an event on the user's primary calendar. Times are local wall-clock + an IANA timeZone. */
export async function createCalendarEvent(
  token: string, ev: { summary: string; startLocal: string; endLocal: string; timeZone: string; description?: string }
): Promise<{ ok: boolean; htmlLink?: string; note?: string }> {
  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        summary: ev.summary,
        description: ev.description,
        start: { dateTime: ev.startLocal, timeZone: ev.timeZone },
        end: { dateTime: ev.endLocal, timeZone: ev.timeZone }
      })
    });
    if (!res.ok) return { ok: false, note: `calendar ${res.status}: ${(await res.text()).slice(0, 160)}` };
    const d = (await res.json()) as { htmlLink?: string };
    return { ok: true, htmlLink: d.htmlLink };
  } catch (e) {
    return { ok: false, note: e instanceof Error ? e.message : 'calendar error' };
  }
}
