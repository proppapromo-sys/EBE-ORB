/**
 * places.ts — EBE finds restaurants "in the area" via Google Places API (Places API New).
 *
 * Needs a Google Maps Platform key (GOOGLE_PLACES_API_KEY) — separate from the Gemini key and from
 * Google sign-in. Degrades gracefully: no key → { available:false, note }.
 */
import 'dotenv/config';

export function placesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY);
}

export type Place = {
  name: string;
  address?: string;
  rating?: number;
  priceLevel?: string;
  phone?: string;
  website?: string;
  id?: string;
};

export type PlacesResult = { available: boolean; results: Place[]; note?: string };

export async function searchRestaurants(opts: {
  query?: string; area?: string; lat?: number; lon?: number; limit?: number;
}): Promise<PlacesResult> {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return { available: false, results: [], note: 'Set GOOGLE_PLACES_API_KEY (Google Maps Platform) to find restaurants in the area.' };

  const base = opts.query?.trim() || 'best restaurants';
  const textQuery = opts.area ? `${base} in ${opts.area}` : base;
  const body: Record<string, unknown> = { textQuery, maxResultCount: Math.min(opts.limit ?? 8, 15) };
  if (Number.isFinite(opts.lat) && Number.isFinite(opts.lon)) {
    body.locationBias = { circle: { center: { latitude: opts.lat, longitude: opts.lon }, radius: 6000 } };
  }
  try {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.nationalPhoneNumber,places.websiteUri,places.id'
      },
      body: JSON.stringify(body)
    });
    if (!r.ok) return { available: false, results: [], note: `places ${r.status}: ${(await r.text()).slice(0, 160)}` };
    const d = (await r.json()) as {
      places?: { displayName?: { text?: string }; formattedAddress?: string; rating?: number;
        priceLevel?: string; nationalPhoneNumber?: string; websiteUri?: string; id?: string }[];
    };
    const results: Place[] = (d.places ?? []).map((p) => ({
      name: p.displayName?.text ?? '(unnamed)',
      address: p.formattedAddress,
      rating: p.rating,
      priceLevel: (p.priceLevel || '').replace('PRICE_LEVEL_', '').toLowerCase() || undefined,
      phone: p.nationalPhoneNumber,
      website: p.websiteUri,
      id: p.id
    }));
    return { available: true, results };
  } catch (e) {
    return { available: false, results: [], note: e instanceof Error ? e.message : 'places error' };
  }
}
