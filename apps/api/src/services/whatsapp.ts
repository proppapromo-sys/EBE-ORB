/**
 * whatsapp.ts — talk to ORB over WhatsApp. Inbound message → ORB answers → reply, over the same
 * brain (askOrb). Two providers, auto-detected: Meta's WhatsApp Cloud API, or Twilio WhatsApp
 * (reuses your existing Twilio creds). Degrades gracefully — not configured = inbound is ignored.
 */
import { getPlatformKey } from './platformKeys.js';
import { getUserPlan } from './planStore.js';
import { askOrb } from '../agents/masterAgent.js';

type Provider = 'meta' | 'twilio' | null;

function provider(): Provider {
  if (getPlatformKey('WHATSAPP_TOKEN') && getPlatformKey('WHATSAPP_PHONE_ID')) return 'meta';
  if (getPlatformKey('TWILIO_ACCOUNT_SID') && getPlatformKey('TWILIO_AUTH_TOKEN') && getPlatformKey('TWILIO_WHATSAPP_FROM')) return 'twilio';
  return null;
}
export function whatsappConfigured(): boolean { return provider() !== null; }

/** Meta webhook verification token (for the GET challenge). */
export function whatsappVerifyToken(): string { return getPlatformKey('WHATSAPP_VERIFY_TOKEN') || 'orb'; }

async function sendMeta(to: string, text: string): Promise<void> {
  const token = getPlatformKey('WHATSAPP_TOKEN'), phoneId = getPlatformKey('WHATSAPP_PHONE_ID');
  if (!token || !phoneId) return;
  await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text.slice(0, 4000) } })
  });
}

async function sendTwilio(to: string, text: string): Promise<void> {
  const sid = getPlatformKey('TWILIO_ACCOUNT_SID'), tok = getPlatformKey('TWILIO_AUTH_TOKEN'), from = getPlatformKey('TWILIO_WHATSAPP_FROM');
  if (!sid || !tok || !from) return;
  const body = new URLSearchParams({ From: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`, To: `whatsapp:${to.replace('whatsapp:', '')}`, Body: text.slice(0, 4000) });
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${tok}`).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
}

/** Send a WhatsApp message via whichever provider is configured. */
export async function sendWhatsApp(to: string, text: string): Promise<void> {
  const p = provider();
  if (p === 'meta') return sendMeta(to, text);
  if (p === 'twilio') return sendTwilio(to, text);
}

/** Pull {from, text} out of either a Twilio form post or a Meta JSON webhook. */
export function parseInbound(body: any): { from: string; text: string } | null {
  if (body && body.From && typeof body.Body === 'string') {        // Twilio
    return { from: String(body.From).replace('whatsapp:', ''), text: body.Body };
  }
  try {                                                             // Meta Cloud API
    const msg = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (msg && (msg.text?.body || '').trim()) return { from: String(msg.from), text: String(msg.text.body) };
  } catch { /* not a message event */ }
  return null;
}

/** Handle one inbound WhatsApp message: run it through ORB and reply. Best-effort. */
export async function handleInbound(body: any): Promise<void> {
  const m = parseInbound(body);
  if (!m || !m.text.trim()) return;
  const userId = `wa:${m.from}`;                                    // WhatsApp number is the user key
  try {
    const plan = await getUserPlan(userId);
    const result: any = await askOrb(userId, m.text, { plan });
    await sendWhatsApp(m.from, (result && result.answer) || "I'm here.");
  } catch (e) {
    await sendWhatsApp(m.from, "I hit a snag just now — try me again in a moment.");
  }
}
