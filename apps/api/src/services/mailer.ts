/**
 * mailer.ts — lets EBE send email on the owner's behalf (e.g., reservation requests to a
 * restaurant). Uses Resend (RESEND_API_KEY) when configured; degrades gracefully otherwise.
 */
import 'dotenv/config';

export function mailerConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EBE_FROM_EMAIL);
}

export type MailResult = { sent: boolean; id?: string; note?: string };

export async function sendMail(to: string, subject: string, text: string): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EBE_FROM_EMAIL;
  if (!key || !from) return { sent: false, note: 'Email not configured (set RESEND_API_KEY + EBE_FROM_EMAIL).' };
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, subject, text })
    });
    if (!r.ok) return { sent: false, note: `mail ${r.status}: ${(await r.text()).slice(0, 160)}` };
    const d = (await r.json()) as { id?: string };
    return { sent: true, id: d.id };
  } catch (e) {
    return { sent: false, note: e instanceof Error ? e.message : 'mail error' };
  }
}
