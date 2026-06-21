/**
 * reservations.ts — EBE makes restaurant reservations (confirm-first).
 *
 * OpenTable has no open public booking API — it's partner-gated (apply at
 * opentable.com/restaurant-solutions/api-partners; ~3–4 wk approval; sandbox available), and even
 * partners can't fully complete a booking server-side. So this is provider-pluggable:
 *   • TODAY  → a one-tap OpenTable booking/search link the owner confirms (works with no API).
 *   • LATER  → the OpenTable Partner API (availability + booking link) once OPENTABLE_API_TOKEN is set.
 * Same shape works for Resy / Google "Reserve with Google" by adding providers.
 */
import 'dotenv/config';

export type ReservationRequest = {
  restaurant: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:mm (24h)
  partySize: number;
  city?: string;
  restaurantId?: string; // OpenTable rid, when known
  notes?: string;
};

export function opentableConfigured(): boolean {
  return Boolean(process.env.OPENTABLE_API_TOKEN);
}

/** A public OpenTable link prefilled with the request — opens to complete the booking. */
export function opentableLink(r: ReservationRequest): string {
  const dateTime = `${r.date}T${r.time || '19:00'}`;
  const p = new URLSearchParams({ covers: String(r.partySize || 2), dateTime });
  if (r.restaurantId) {
    p.set('rid', r.restaurantId);
    return `https://www.opentable.com/booking/restref/availability?${p.toString()}`;
  }
  p.set('term', r.restaurant || '');
  if (r.city) p.set('metro', r.city);
  return `https://www.opentable.com/s?${p.toString()}`;
}

export type BookingResult = {
  status: 'link' | 'booked' | 'error';
  link: string;
  confirmation?: string;
  note?: string;
};

/** Execute a reservation. Returns a confirm link today; real partner booking when approved. */
export async function bookReservation(r: ReservationRequest): Promise<BookingResult> {
  const link = opentableLink(r);
  if (!opentableConfigured()) {
    return {
      status: 'link',
      link,
      note:
        'OpenTable partner API not connected — using a one-tap booking link. Apply at ' +
        'opentable.com/restaurant-solutions/api-partners to enable in-app booking.'
    };
  }
  // Partner path: OpenTable issues a booking link / availability via your approved app + rid.
  // (Full server-side completion isn't offered to most partners — the diner confirms on OpenTable.)
  // TODO: call the OpenTable Partner availability/reservation endpoint with OPENTABLE_API_TOKEN + rid.
  return {
    status: 'link',
    link,
    note: 'Partner token present — availability/booking calls wire in here once your OpenTable app is approved.'
  };
}
