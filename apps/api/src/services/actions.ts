/**
 * actions.ts — ORB does things, safely. Low-risk actions (reminders/tasks) run immediately;
 * anything outward-facing (sending email) is CONFIRM-FIRST: ORB stages it and waits for the owner's
 * "confirm" before it goes out. Nothing leaves without a yes.
 */
import { createTask } from './taskStore.js';
import { sendMail, mailerConfigured } from './mailer.js';
import { getAccessToken, createCalendarEvent } from '../connectors/google.js';
import { getLastOffers, duffelCreateOrder } from './travel.js';
import { getTraveler, travelerComplete } from './profileStore.js';

type EmailPending = { kind: 'email'; to: string; subject: string; body: string; summary: string };
type EventPending = { kind: 'event'; summary: string; startLocal: string; endLocal: string; timeZone: string; when: string };
type BookPending = { kind: 'book'; offerId: string; amount: string; currency: string; label: string };
type Pending = EmailPending | EventPending | BookPending;
const pending = new Map<string, Pending>();

const pad = (n: number) => String(n).padStart(2, '0');
const WD = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Resolve "tomorrow at 2pm" / "Friday 10am" into a local wall-clock window in the user's timezone. */
function parseWhen(message: string, tz: string): { startLocal: string; endLocal: string; label: string } | null {
  const lower = message.toLowerCase();
  // base date = "today" in the user's timezone
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const [y, mo, da] = todayStr.split('-').map(Number);
  const base = new Date(Date.UTC(y, mo - 1, da));
  if (/\btomorrow\b/.test(lower)) base.setUTCDate(base.getUTCDate() + 1);
  else {
    const wm = lower.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
    if (wm) { let diff = (WD.indexOf(wm[1]) - base.getUTCDay() + 7) % 7; if (diff === 0) diff = 7; base.setUTCDate(base.getUTCDate() + diff); }
  }
  // time
  let hour: number | null = null, min = 0;
  if (/\bnoon\b/.test(lower)) hour = 12;
  else if (/\bmidnight\b/.test(lower)) hour = 0;
  else {
    const tm = lower.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
    if (tm) { hour = parseInt(tm[1], 10); min = tm[2] ? parseInt(tm[2], 10) : 0; const ap = tm[3];
      if (ap === 'pm' && hour < 12) hour += 12; if (ap === 'am' && hour === 12) hour = 0;
      if (!ap && hour >= 1 && hour <= 7) hour += 12; }   // "at 2" → 2pm
  }
  if (hour == null) return null;
  const d = `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}`;
  const startLocal = `${d}T${pad(hour)}:${pad(min)}:00`;
  const endLocal = `${d}T${pad((hour + 1) % 24)}:${pad(min)}:00`;
  const label = new Date(`${startLocal}Z`).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return { startLocal, endLocal, label };
}

function parseEventTitle(message: string): string {
  const m = message.match(/\b(?:schedule|create|add|set up|book|put)\s+(?:an? |the )?(?:event|meeting|appointment|reminder|call)?\s*(?:for |with |called |titled )?(.+?)(?:\s+(?:on|at|for|tomorrow|today|this|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b.*)?$/i);
  const t = m && m[1] ? m[1].trim() : '';
  return (t && t.length > 1 ? t : 'Event').slice(0, 140);
}

const CONFIRM = /\b(confirm|yes|yep|yeah|do it|send it|go ahead|approved?|ok(?:ay)? do it|please do)\b/i;
const CANCEL = /\b(cancel|no|nope|stop|don'?t|drop it|never\s?mind)\b/i;

function parseReminder(message: string): { title: string } | null {
  const m = message.match(/\b(?:remind me to|reminder to|add (?:a )?task(?: to)?|add (?:a )?reminder(?: to)?|note to self:?|to-?do:?)\s+(.+)$/i);
  return m ? { title: m[1].replace(/[?.!]+$/, '').trim().slice(0, 200) } : null;
}

function parseEmail(message: string): EmailPending | null {
  const to = (message.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i) ?? [])[1];
  if (!to) return null;
  let subject = 'A note from me', body = '';
  const sub = message.match(/\b(?:about|subject|regarding|re:?)\s+(.+?)(?:\s+(?:saying|body|that says|message|tell)\b|$)/i);
  if (sub) subject = sub[1].trim().slice(0, 140);
  const bod = message.match(/\b(?:saying|body|message|that says|tell (?:them|him|her))\s+(.+)$/i);
  if (bod) body = bod[1].trim();
  if (!body) body = subject;
  return { kind: 'email', to, subject, body, summary: `email ${to} — "${subject}"` };
}

export function hasPendingAction(userId: string): boolean { return pending.has(userId); }

const EVENT_RE = /\b(schedule|calendar|meeting|appointment|book (?:a|an)|add (?:an? )?event|set up (?:a|an)|put .* on (?:my|the) calendar)\b/i;

/** Returns an action reply, or null if the message isn't an action (let normal chat handle it). */
export async function handleAction(userId: string, message: string, opts: { tz?: string } = {}): Promise<{ mode: 'action'; answer: string } | null> {
  const tz = opts.tz || 'America/New_York';
  // 1) Resolve a staged confirm-first action.
  const p = pending.get(userId);
  if (p) {
    if (CONFIRM.test(message)) {
      pending.delete(userId);
      if (p.kind === 'email') {
        const r = await sendMail(p.to, p.subject, p.body);
        return { mode: 'action', answer: r.sent ? `Sent — your email to ${p.to} is on its way.` : `I couldn't send it: ${r.note || 'email not set up'}.` };
      }
      if (p.kind === 'event') {
        const token = await getAccessToken(userId);
        if (!token) return { mode: 'action', answer: `I need your Google calendar connected first — connect it in the Connect tab and try again.` };
        const r = await createCalendarEvent(token, { summary: p.summary, startLocal: p.startLocal, endLocal: p.endLocal, timeZone: p.timeZone });
        return { mode: 'action', answer: r.ok ? `Added to your calendar: ${p.summary}, ${p.when}.` : `I couldn't add it: ${r.note || 'calendar error'}.` };
      }
      // p.kind === 'book' — charge the central travel funds and book the flight.
      const t = await getTraveler(userId);
      const r = await duffelCreateOrder(p.offerId, {
        given_name: t.given_name!, family_name: t.family_name!, born_on: t.born_on!,
        gender: t.gender || 'm', title: t.title || 'mr', email: t.email!, phone: t.phone!
      }, p.amount, p.currency);
      return { mode: 'action', answer: r.ok ? `✈️ Booked! Confirmation ${r.ref}. ${p.label} for $${p.amount} ${p.currency}.` : `Booking didn't go through: ${r.note}. (Your travel funds in Payments & Banking may need topping up.)` };
    }
    if (CANCEL.test(message)) { pending.delete(userId); return { mode: 'action', answer: 'Okay, I dropped it.' }; }
  }

  // Book a flight from the last search — confirm-first, charged to the central payment method.
  if (/\bbook\b/i.test(message) && /\b(flight|it|offer|trip|first|second|third|cheapest|that one)\b/i.test(message)) {
    const offers = getLastOffers(userId);
    if (!offers.length) return { mode: 'action', answer: `Search flights first (e.g. "flights from Atlanta to Miami July 5"), then say "book the first one".` };
    const idx = /\b(second|2nd|two)\b/i.test(message) ? 1 : /\b(third|3rd|three)\b/i.test(message) ? 2 : 0;
    const offer = offers[Math.min(idx, offers.length - 1)];
    const t = await getTraveler(userId);
    if (!travelerComplete(t)) return { mode: 'action', answer: `Before I can book, add your traveler details in Payments & Banking (full name, date of birth, email, phone).` };
    pending.set(userId, { kind: 'book', offerId: offer.id, amount: offer.amount, currency: offer.currency, label: offer.label });
    return { mode: 'action', answer: `Ready to book ${offer.label} for $${offer.amount} ${offer.currency}, charged to your travel funds. Say "confirm" to book, or "cancel".` };
  }

  // Calendar event — confirm-first.
  if (EVENT_RE.test(message)) {
    const when = parseWhen(message, tz);
    const summary = parseEventTitle(message);
    if (when) {
      pending.set(userId, { kind: 'event', summary, startLocal: when.startLocal, endLocal: when.endLocal, timeZone: tz, when: when.label });
      return { mode: 'action', answer: `Ready to add "${summary}" to your calendar, ${when.label}. Say "confirm" to add it, or "cancel".` };
    }
    return { mode: 'action', answer: `Sure — what day and time? (e.g. "tomorrow at 2pm")` };
  }

  // 2) Reminders / tasks — low risk, do it now.
  const rem = parseReminder(message);
  if (rem && rem.title) {
    try { await createTask(userId, { title: rem.title, domain: 'personal' }); return { mode: 'action', answer: `Done — I'll keep that on your list: ${rem.title}.` }; }
    catch { return { mode: 'action', answer: `I noted it: ${rem.title}. (It'll persist once a database is connected.)` }; }
  }

  // 3) Send email — confirm-first.
  if (/\b(e-?mail|send (?:an? )?(?:email|message|note) to)\b/i.test(message)) {
    const em = parseEmail(message);
    if (em) {
      if (!mailerConfigured()) return { mode: 'action', answer: `I can draft it, but email isn't set up yet — add a Resend key in the Keys tab and I'll send for you.` };
      pending.set(userId, em);
      return { mode: 'action', answer: `Ready to email ${em.to} — subject "${em.subject}". Say "confirm" to send, or "cancel".` };
    }
  }
  return null;
}
