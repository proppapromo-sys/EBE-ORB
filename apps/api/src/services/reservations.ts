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
import { sendMail, mailerConfigured } from './mailer.js';

export type ReservationRequest = {
  restaurant: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:mm (24h)
  partySize: number;
  city?: string;
  restaurantId?: string;   // OpenTable rid, when known
  restaurantEmail?: string; // if known, EBE emails the request directly (true auto-book)
  ownerName?: string;
  ownerContact?: string;   // phone/email the restaurant can reply to
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
  status: 'requested' | 'link' | 'booked' | 'error';
  link: string;
  confirmation?: string;
  note?: string;
};

/**
 * Execute a reservation. Order of preference:
 *  1) If we have the restaurant's email + a mailer → EBE sends the request directly (true auto-book).
 *  2) Else fall back to a one-tap OpenTable link the owner confirms.
 */
export async function bookReservation(r: ReservationRequest): Promise<BookingResult> {
  const link = opentableLink(r);

  // 1) Direct request to the restaurant — fully handled by EBE, no tapping.
  if (r.restaurantEmail && mailerConfigured()) {
    const subject = `Reservation request — party of ${r.partySize}, ${r.date} ${r.time}`;
    const body =
      `Hello ${r.restaurant},\n\n` +
      `I'd like to request a table for ${r.partySize} on ${r.date} at ${r.time}.` +
      (r.notes ? `\nNote: ${r.notes}` : '') +
      `\n\nName: ${r.ownerName || 'EBE (on behalf of the guest)'}` +
      (r.ownerContact ? `\nReply to: ${r.ownerContact}` : '') +
      `\n\nCould you please confirm availability? Thank you.`;
    const m = await sendMail(r.restaurantEmail, subject, body, r.ownerContact); // replies → the owner
    if (m.sent) {
      return { status: 'requested', link,
        confirmation: m.id, note: `Request emailed to ${r.restaurant}. I'll let you know when they confirm.` };
    }
    return { status: 'link', link, note: `Couldn't email the restaurant (${m.note}). Use the link to confirm.` };
  }

  // 2) OpenTable link (no key needed; partner API wires in here once approved).
  return {
    status: 'link',
    link,
    note: opentableConfigured()
      ? 'Partner token present — availability/booking wires in here once your OpenTable app is approved.'
      : "Tap the link to confirm on OpenTable. (To have me book without a tap, give me the restaurant's email, or become an OpenTable partner.)"
  };
}
