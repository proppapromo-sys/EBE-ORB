/**
 * travel.ts — flights & hotels via Amadeus (free self-service API). SEARCH works with a key;
 * BOOKING is intentionally confirm-first and handed to the provider (real ticketing needs an
 * Amadeus/Duffel production agreement + payment). Reads keys live; degrades gracefully.
 *
 * Set AMADEUS_CLIENT_ID + AMADEUS_CLIENT_SECRET (and AMADEUS_HOST=api.amadeus.com for production;
 * defaults to the test host).
 */
import { getPlatformKey } from './platformKeys.js';

function host(): string { return getPlatformKey('AMADEUS_HOST') || 'test.api.amadeus.com'; }
export function travelConfigured(): boolean {
  return Boolean(getPlatformKey('AMADEUS_CLIENT_ID') && getPlatformKey('AMADEUS_CLIENT_SECRET'));
}

let token = { v: '', exp: 0 };
async function getToken(): Promise<string | null> {
  if (token.v && token.exp > Date.now()) return token.v;
  const id = getPlatformKey('AMADEUS_CLIENT_ID'), secret = getPlatformKey('AMADEUS_CLIENT_SECRET');
  if (!id || !secret) return null;
  try {
    const r = await fetch(`https://${host()}/v1/security/oauth2/token`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret })
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { access_token: string; expires_in: number };
    token = { v: d.access_token, exp: Date.now() + (d.expires_in - 60) * 1000 };
    return token.v;
  } catch { return null; }
}
async function aget(path: string): Promise<any | null> {
  const t = await getToken(); if (!t) return null;
  try { const r = await fetch(`https://${host()}${path}`, { headers: { Authorization: `Bearer ${t}` } }); return r.ok ? r.json() : null; }
  catch { return null; }
}

/** Resolve a city/airport name → IATA code (e.g. "Miami" → "MIA"). */
export async function cityCode(keyword: string): Promise<string | null> {
  if (/^[A-Z]{3}$/.test(keyword.trim())) return keyword.trim().toUpperCase();
  const d = await aget(`/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${encodeURIComponent(keyword)}&page%5Blimit%5D=1`);
  return d?.data?.[0]?.iataCode ?? null;
}

/** Search flight offers. Returns a compact, readable summary. */
export async function searchFlights(origin: string, dest: string, date: string, adults = 1): Promise<string | null> {
  if (!travelConfigured()) return null;
  const [o, dcode] = await Promise.all([cityCode(origin), cityCode(dest)]);
  if (!o || !dcode) return null;
  const d = await aget(`/v2/shopping/flight-offers?originLocationCode=${o}&destinationLocationCode=${dcode}&departureDate=${date}&adults=${adults}&currencyCode=USD&max=4`);
  const offers = d?.data ?? [];
  if (!offers.length) return `Flights ${o}→${dcode} on ${date}: none found.`;
  const lines = offers.slice(0, 4).map((f: any) => {
    const it = f.itineraries?.[0]; const segs = it?.segments ?? [];
    const carrier = segs[0]?.carrierCode ?? '??'; const stops = segs.length - 1;
    const dep = segs[0]?.departure?.at?.slice(11, 16); const arr = segs[segs.length - 1]?.arrival?.at?.slice(11, 16);
    return `- ${carrier} ${o}→${dcode} ${dep}→${arr}, ${stops === 0 ? 'nonstop' : stops + ' stop'}, $${f.price?.grandTotal}`;
  });
  return `Flights ${o}→${dcode}, ${date} (live):\n${lines.join('\n')}`;
}

/** Search hotels in a city. Returns a compact list. */
export async function searchHotels(city: string): Promise<string | null> {
  if (!travelConfigured()) return null;
  const code = await cityCode(city);
  if (!code) return null;
  const d = await aget(`/v1/reference-data/locations/hotels/by-city?cityCode=${code}&radius=20&radiusUnit=KM`);
  const hotels = d?.data ?? [];
  if (!hotels.length) return `Hotels in ${city}: none found.`;
  const lines = hotels.slice(0, 5).map((h: any) => `- ${h.name}${h.address?.countryCode ? ` (${h.address.countryCode})` : ''}`);
  return `Hotels near ${city} (live):\n${lines.join('\n')}`;
}
