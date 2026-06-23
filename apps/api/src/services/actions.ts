/**
 * actions.ts — ORB does things, safely. Low-risk actions (reminders/tasks) run immediately;
 * anything outward-facing (sending email) is CONFIRM-FIRST: ORB stages it and waits for the owner's
 * "confirm" before it goes out. Nothing leaves without a yes.
 */
import { createTask } from './taskStore.js';
import { sendMail, mailerConfigured } from './mailer.js';

type Pending = { kind: 'email'; to: string; subject: string; body: string; summary: string };
const pending = new Map<string, Pending>();

const CONFIRM = /\b(confirm|yes|yep|yeah|do it|send it|go ahead|approved?|ok(?:ay)? do it|please do)\b/i;
const CANCEL = /\b(cancel|no|nope|stop|don'?t|drop it|never\s?mind)\b/i;

function parseReminder(message: string): { title: string } | null {
  const m = message.match(/\b(?:remind me to|reminder to|add (?:a )?task(?: to)?|add (?:a )?reminder(?: to)?|note to self:?|to-?do:?)\s+(.+)$/i);
  return m ? { title: m[1].replace(/[?.!]+$/, '').trim().slice(0, 200) } : null;
}

function parseEmail(message: string): Pending | null {
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

/** Returns an action reply, or null if the message isn't an action (let normal chat handle it). */
export async function handleAction(userId: string, message: string): Promise<{ mode: 'action'; answer: string } | null> {
  // 1) Resolve a staged confirm-first action.
  const p = pending.get(userId);
  if (p) {
    if (CONFIRM.test(message)) {
      pending.delete(userId);
      const r = await sendMail(p.to, p.subject, p.body);
      return { mode: 'action', answer: r.sent ? `Sent — your email to ${p.to} is on its way.` : `I couldn't send it: ${r.note || 'email not set up'}.` };
    }
    if (CANCEL.test(message)) { pending.delete(userId); return { mode: 'action', answer: 'Okay, I dropped it.' }; }
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
