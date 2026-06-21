import { Router } from 'express';
import { z } from 'zod';
import { askOrb, gatherContext, createAction, dailyBriefing } from '../agents/masterAgent.js';
import { connectors, getConnector } from '../connectors/index.js';
import { runOrbCycle } from '../genome/orbBranch.js';
import { createJournal, journalIsDurable } from '../services/journalStore.js';
import { runCouncil } from '../brains/council.js';
import { BRAINS, COUNCIL_ORDER } from '../brains/brains.js';
import { getProviderClient } from '../brains/providers.js';
import { listCouncilRuns, councilLogDurable } from '../services/councilStore.js';
import { buildAuthUrl, exchangeCode, isConfigured as googleConfigured } from '../connectors/google.js';
import {
  enqueueAction,
  listActions,
  approveAction,
  rejectAction,
  executeAction,
  type QueuedActionStatus
} from '../services/actionStore.js';

export const orbRouter = Router();

const CycleSchema = z.object({
  userId: z.string().min(1).default('demo-user'),
  bankroll: z.number().positive().optional(),
  minEdge: z.number().min(0).max(1).optional(),
  enqueue: z.boolean().optional() // also push surfaced actions onto the approval queue
});

const CouncilSchema = z.object({
  userId: z.string().min(1).default('demo-user'),
  request: z.string().min(1),
  images: z.array(z.string()).optional(),
  documents: z.string().optional()
});

const OutcomeSchema = z.object({
  userId: z.string().min(1).default('demo-user'),
  itemId: z.string().min(1),
  score: z.number().optional(),
  win: z.boolean().optional(),
  patterns: z.array(z.string()).optional()
});

const AskSchema = z.object({
  userId: z.string().min(1).default('demo-user'),
  message: z.string().min(1),
  council: z.boolean().optional(), // default true — convene the full council
  documents: z.string().optional(),
  images: z.array(z.string()).optional()
});

orbRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'EBE ORB API', timestamp: new Date().toISOString() });
});

orbRouter.get('/connectors', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? 'demo-user');
    const list = await Promise.all(
      connectors.map(async (c) => ({ name: c.name, domain: c.domain, status: await c.status(userId) }))
    );
    res.json({ connectors: list });
  } catch (error) { next(error); }
});

// ── OAuth: connect a live data source (Google → Gmail + Calendar) ────────────
orbRouter.get('/connectors/:name/auth', (req, res) => {
  const userId = String(req.query.userId ?? 'demo-user');
  const name = req.params.name;
  if (name === 'gmail' || name === 'google_calendar' || name === 'google') {
    if (!googleConfigured()) return res.status(400).json({ error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID/SECRET.' });
    return res.json({ provider: 'google', url: buildAuthUrl(`google|${userId}`) });
  }
  return res.status(404).json({ error: `No OAuth flow wired for connector "${name}".` });
});

orbRouter.get('/oauth/google/callback', async (req, res, next) => {
  try {
    const code = String(req.query.code ?? '');
    const state = String(req.query.state ?? '');
    const userId = state.startsWith('google|') ? state.slice('google|'.length) : 'demo-user';
    if (!code) return res.status(400).send('Missing authorization code.');
    await exchangeCode(userId, code);
    const back = process.env.OAUTH_SUCCESS_REDIRECT;
    if (back) return res.redirect(back);
    res.set('content-type', 'text/html').send(
      '<body style="background:#05080f;color:#bdf3ff;font-family:monospace;text-align:center;padding-top:18%">' +
      '✅ Google connected to ORB. You can close this tab.</body>'
    );
  } catch (error) { next(error); }
});

orbRouter.post('/context', async (req, res, next) => {
  try {
    const userId = String(req.body?.userId ?? 'demo-user');
    const context = await gatherContext(userId);
    res.json({ userId, context });
  } catch (error) { next(error); }
});

orbRouter.post('/ask', async (req, res, next) => {
  try {
    const parsed = AskSchema.parse(req.body);
    const result = await askOrb(parsed.userId, parsed.message, {
      council: parsed.council,
      documents: parsed.documents,
      images: parsed.images
    });
    res.json(result);
  } catch (error) { next(error); }
});

// Run one ORB genome cycle: connectors → edge gate → eyes → risk → confirm-first actions.
// Persists every decision to the Journal (so trust compounds) and reads learned trust back in.
orbRouter.post('/cycle', async (req, res, next) => {
  try {
    const parsed = CycleSchema.parse(req.body ?? {});
    const journal = createJournal(parsed.userId);
    const report = await runOrbCycle(connectors, parsed.userId, {
      bankroll: parsed.bankroll,
      minEdge: parsed.minEdge,
      journal
    });
    let queued: unknown[] | undefined;
    if (parsed.enqueue) {
      queued = await Promise.all(report.actions.map((a) => enqueueAction(parsed.userId, a)));
    }
    res.json({ ...report, durable: journalIsDurable, queued });
  } catch (error) { next(error); }
});

// Record what actually happened (law 3: forward-validate). Feeds the compounding trust.
orbRouter.post('/outcome', async (req, res, next) => {
  try {
    const parsed = OutcomeSchema.parse(req.body ?? {});
    const score = parsed.score ?? (parsed.win === false ? -1 : 1);
    const journal = createJournal(parsed.userId);
    const record = await journal.recordOutcome('orb', parsed.itemId, score, parsed.patterns ?? []);
    res.json({ recorded: record, durable: journalIsDurable });
  } catch (error) { next(error); }
});

// ── Confirm-first approval workflow (law 5) ─────────────────────────────────
orbRouter.get('/actions', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? 'demo-user');
    const status = req.query.status as QueuedActionStatus | undefined;
    res.json({ actions: await listActions(userId, status) });
  } catch (error) { next(error); }
});

orbRouter.post('/actions/:id/approve', async (req, res, next) => {
  try {
    const userId = String(req.body?.userId ?? 'demo-user');
    const action = await approveAction(userId, req.params.id);
    if (!action) return res.status(404).json({ error: 'action not found' });
    res.json({ action });
  } catch (error) { next(error); }
});

orbRouter.post('/actions/:id/reject', async (req, res, next) => {
  try {
    const userId = String(req.body?.userId ?? 'demo-user');
    const action = await rejectAction(userId, req.params.id);
    if (!action) return res.status(404).json({ error: 'action not found' });
    res.json({ action });
  } catch (error) { next(error); }
});

orbRouter.post('/actions/:id/execute', async (req, res, next) => {
  try {
    const userId = String(req.body?.userId ?? 'demo-user');
    const live = Boolean(req.body?.live);
    const result = await executeAction(userId, req.params.id, live);
    res.json(result);
  } catch (error) { next(error); }
});

// ── ORB Multi-Model Council ─────────────────────────────────────────────────
// GPT-Executive → GPT-Operations → GPT-Risk → Claude-Evaluator → Gemini-VisualVerifier → ORB-Finalizer.
// The genome cycle (code-level risk gate) runs first and stays authoritative.
orbRouter.get('/council', (_req, res) => {
  res.json({
    order: COUNCIL_ORDER,
    members: COUNCIL_ORDER.map((role) => ({
      role,
      label: BRAINS[role].label,
      provider: BRAINS[role].provider,
      model: BRAINS[role].model,
      configured: getProviderClient(BRAINS[role].provider).configured
    }))
  });
});

orbRouter.post('/council', async (req, res, next) => {
  try {
    const parsed = CouncilSchema.parse(req.body ?? {});
    const result = await runCouncil(parsed.userId, parsed.request, {
      images: parsed.images,
      documents: parsed.documents
    });
    res.json(result);
  } catch (error) { next(error); }
});

// ORB logs everything: retrieve recent council runs (full transcripts).
orbRouter.get('/council/history', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? 'demo-user');
    const limit = Math.min(100, Number(req.query.limit ?? 20) || 20);
    res.json({ durable: councilLogDurable, runs: await listCouncilRuns(userId, limit) });
  } catch (error) { next(error); }
});

orbRouter.post('/briefing', async (req, res, next) => {
  try {
    const userId = String(req.body?.userId ?? 'demo-user');
    const briefing = await dailyBriefing(userId);
    res.json(briefing);
  } catch (error) { next(error); }
});

orbRouter.post('/actions/demo', (req, res) => {
  const action = createAction({
    title: req.body?.title ?? 'Draft daily briefing',
    description: req.body?.description ?? 'Prepare a morning priority briefing.',
    domain: req.body?.domain ?? 'personal',
    riskLevel: req.body?.riskLevel ?? 'low',
    toolName: req.body?.toolName,
    payload: req.body?.payload ?? {}
  });
  res.json({ action });
});

orbRouter.post('/connectors/:name/execute', async (req, res, next) => {
  try {
    const connector = getConnector(req.params.name);
    if (!connector || !connector.execute) return res.status(404).json({ error: 'Connector not found or cannot execute actions.' });
    const userId = String(req.body?.userId ?? 'demo-user');
    const action = req.body?.action;
    const result = await connector.execute(userId, action);
    res.json(result);
  } catch (error) { next(error); }
});
