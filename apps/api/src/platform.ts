/**
 * platform.ts — the Universal ORB Platform, as one function. Call mountOrb(app) on any Express app
 * and you get the whole stack under /api/orb: the multi-AI council + speed router, the Build genome,
 * AI video (Runway/Veo), cloned voice + speaker recognition, six-tier billing (Stripe, trials,
 * annual), owner admin metrics, in-app key management, and Apple/phone/Google/email sign-in.
 *
 * Drop it into another build:
 *   import express from 'express';
 *   import { mountOrb } from './platform.js';
 *   const app = express();
 *   mountOrb(app);            // ← everything, under /api/orb
 *   app.listen(8080);
 *
 * Configure with env or the in-app Keys panel. Nothing is required to boot — every integration
 * degrades gracefully when its key is absent.
 */
import express, { type Express } from 'express';
import { orbRouter } from './routes/orb.js';
import { handleWebhook } from './services/billing.js';
import { cloneVoice, verifySpeaker } from './services/tts.js';
import { isOwner } from './services/planStore.js';

export function mountOrb(app: Express, opts: { jsonLimit?: string } = {}): Express {
  // Baseline safety headers on every ORB API response (cheap, no deps).
  app.use('/api/orb', (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  // Raw-body routes MUST be registered before any JSON parser (signature/audio need raw bytes).
  app.post('/api/orb/billing/webhook', express.raw({ type: () => true, limit: '5mb' }), async (req, res) => {
    try { res.json(await handleWebhook(req.body as Buffer, req.header('stripe-signature'))); }
    catch (err) { res.status(400).json({ error: err instanceof Error ? err.message : 'webhook error' }); }
  });

  app.post('/api/orb/voice/clone', express.raw({ type: () => true, limit: '30mb' }), async (req, res) => {
    try {
      if (!isOwner(String(req.query.userId || ''))) return res.status(403).json({ available: false, note: 'Only the main account can change my voice.' });
      res.json(await cloneVoice(String(req.query.name || 'ORB Voice'), req.body as Buffer, req.header('content-type') || 'audio/mpeg'));
    } catch { res.status(400).json({ available: false }); }
  });

  app.post('/api/orb/voice/verify', express.raw({ type: () => true, limit: '15mb' }), async (req, res) => {
    try { res.json(await verifySpeaker(req.body as Buffer, req.header('content-type') || 'audio/webm')); }
    catch { res.json({ match: true }); }
  });

  // Everything else is JSON, scoped to /api/orb so it never fights the host app's own parsers.
  app.use('/api/orb', express.json({ limit: opts.jsonLimit || '2mb' }), orbRouter);
  return app;
}
