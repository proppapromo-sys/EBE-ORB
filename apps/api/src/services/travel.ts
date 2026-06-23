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

/** Search flight offers. Returns a compact, readable summary. Prefers Duffel (bookable) when set. */
export async function searchFlights(origin: string, dest: string, date: string, adults = 1): Promise<string | null> {
  if (duffelConfigured()) { const r = await duffelSearchFlights(origin, dest, date); if (r) return r; }
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

// ── Duffel: real, bookable flights (search + confirm-first order) ──────────────
const DUFFEL = 'https://api.duffel.com';
export function duffelConfigured(): boolean { return Boolean(getPlatformKey('DUFFEL_TOKEN')); }
function duffelHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${getPlatformKey('DUFFEL_TOKEN')}`, 'Duffel-Version': 'v2', 'content-type': 'application/json', Accept: 'application/json' };
}

/** Resolve a city/airport name → IATA code via Duffel place suggestions. */
async function duffelCity(keyword: string): Promise<string | null> {
  if (/^[A-Z]{3}$/.test(keyword.trim())) return keyword.trim().toUpperCase();
  try {
    const r = await fetch(`${DUFFEL}/places/suggestions?query=${encodeURIComponent(keyword)}`, { headers: duffelHeaders() });
    if (!r.ok) return null;
    const d = (await r.json()) as { data?: { iata_code?: string }[] };
    return (d.data ?? []).find((p) => p.iata_code)?.iata_code ?? null;
  } catch { return null; }
}

/** Search bookable flight offers via Duffel. */
export async function duffelSearchFlights(origin: string, dest: string, date: string): Promise<string | null> {
  const [o, d2] = await Promise.all([duffelCity(origin), duffelCity(dest)]);
  if (!o || !d2) return null;
  try {
    const r = await fetch(`${DUFFEL}/air/offer_requests?return_offers=true`, {
      method: 'POST', headers: duffelHeaders(),
      body: JSON.stringify({ data: { slices: [{ origin: o, destination: d2, departure_date: date }], passengers: [{ type: 'adult' }], cabin_class: 'economy' } })
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { data?: { offers?: any[] } };
    const offers = d.data?.offers ?? [];
    if (!offers.length) return `Flights ${o}→${d2} on ${date}: none found.`;
    const lines = offers.slice(0, 4).map((of: any) => {
      const seg = of.slices?.[0]?.segments ?? [];
      const carr = of.owner?.iata_code ?? seg[0]?.marketing_carrier?.iata_code ?? '??';
      const stops = seg.length - 1;
      const dep = seg[0]?.departing_at?.slice(11, 16); const arr = seg[seg.length - 1]?.arriving_at?.slice(11, 16);
      return `- ${carr} ${o}→${d2} ${dep}→${arr}, ${stops === 0 ? 'nonstop' : stops + ' stop'}, $${of.total_amount}`;
    });
    return `Flights ${o}→${d2}, ${date} (bookable via Duffel):\n${lines.join('\n')}`;
  } catch { return null; }
}

/** Create a Duffel order (BOOK). Requires a selected offer, passenger details, and payment.
 *  Confirm-first: the caller must have collected traveler info + a funded Duffel balance. */
export async function duffelCreateOrder(
  offerId: string, passenger: { given_name: string; family_name: string; born_on: string; gender: string; title: string; email: string; phone: string },
  amount: string, currency = 'USD'
): Promise<{ ok: boolean; ref?: string; note?: string }> {
  if (!duffelConfigured()) return { ok: false, note: 'DUFFEL_TOKEN not set' };
  try {
    const r = await fetch(`${DUFFEL}/air/orders`, {
      method: 'POST', headers: duffelHeaders(),
      body: JSON.stringify({ data: {
        type: 'instant', selected_offers: [offerId],
        passengers: [{ ...passenger }],
        payments: [{ type: 'balance', amount, currency }]
      } })
    });
    if (!r.ok) return { ok: false, note: `duffel ${r.status}: ${(await r.text()).slice(0, 180)}` };
    const d = (await r.json()) as { data?: { booking_reference?: string } };
    return { ok: true, ref: d.data?.booking_reference };
  } catch (e) { return { ok: false, note: e instanceof Error ? e.message : 'duffel order error' }; }
}
