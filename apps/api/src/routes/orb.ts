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
import { remember, listMemories, recall, forget, memoryDurable } from '../services/memoryStore.js';
import { getWeather, geocode } from '../services/weather.js';
import { getNews } from '../services/news.js';
import { getNotepad, saveNotepad, notepadDurable } from '../services/notepadStore.js';
import { generateOrbImage, imageConfigured } from '../services/geminiImage.js';
import {
  createTask, listTasks, completeTask, reopenTask, deleteTask, taskDurable, type TaskStatus
} from '../services/taskStore.js';
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

// ── EBE's senses: time, weather, news, notepad, connection ──────────────────
orbRouter.get('/now', (_req, res) => {
  const d = new Date();
  const h = d.getHours();
  res.json({
    iso: d.toISOString(),
    epoch: d.getTime(),
    date: d.toDateString(),
    time: d.toLocaleTimeString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dayPart: h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'
  });
});

orbRouter.get('/weather', async (req, res, next) => {
  try {
    const city = req.query.city ? String(req.query.city) : '';
    let lat = Number(req.query.lat), lon = Number(req.query.lon), place = city;
    if (city && (!Number.isFinite(lat) || !Number.isFinite(lon))) {
      const g = await geocode(city);
      if (g) { lat = g.lat; lon = g.lon; place = g.name; }
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      lat = Number(process.env.DEFAULT_LAT); lon = Number(process.env.DEFAULT_LON); place = place || process.env.DEFAULT_CITY || '';
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.json({ available: false, note: 'Provide ?city= or ?lat=&lon= (or set DEFAULT_LAT/LON).' });
    }
    res.json(await getWeather(lat, lon, place));
  } catch (error) { next(error); }
});

orbRouter.get('/news', async (req, res, next) => {
  try {
    res.json(await getNews(req.query.topic ? String(req.query.topic) : undefined));
  } catch (error) { next(error); }
});

orbRouter.get('/notepad', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? 'demo-user');
    res.json({ durable: notepadDurable, ...(await getNotepad(userId)) });
  } catch (error) { next(error); }
});
orbRouter.put('/notepad', async (req, res, next) => {
  try {
    const userId = String(req.body?.userId ?? 'demo-user');
    const content = String(req.body?.content ?? '');
    res.json(await saveNotepad(userId, content));
  } catch (error) { next(error); }
});

// Gemini refreshes the orb's imagery (clean, lightning-free core).
orbRouter.post('/vision/orb-image', async (req, res, next) => {
  try {
    res.json({ configured: imageConfigured(), ...(await generateOrbImage(req.body?.prompt)) });
  } catch (error) { next(error); }
});

// Connection awareness: latency probe + sized download for a client-side speed estimate.
orbRouter.get('/ping', (_req, res) => res.json({ t: Date.now() }));
orbRouter.get('/speedtest', (req, res) => {
  const bytes = Math.min(8_000_000, Math.max(1024, Number(req.query.bytes) || 2_000_000));
  res.set('content-type', 'application/octet-stream');
  res.set('cache-control', 'no-store');
  res.send(Buffer.alloc(bytes, 0));
});

// ── Join / onboarding (capture a new owner) ─────────────────────────────────
const JoinSchema = z.object({
  email: z.string().email(),
  name: z.string().optional()
});
orbRouter.post('/join', async (req, res, next) => {
  try {
    const p = JoinSchema.parse(req.body ?? {});
    // the user's key is their email; seed a first memory so EBE "remembers" them
    await remember(p.email, {
      type: 'person',
      title: 'Owner',
      content: `${p.name ? p.name + ' — ' : ''}${p.email} joined EBE ORB.`,
      importance: 9
    });
    res.json({ ok: true, userId: p.email, next: 'connect-google' });
  } catch (error) { next(error); }
});

// ── Memory (what EBE remembers) ─────────────────────────────────────────────
const MemorySchema = z.object({
  userId: z.string().min(1).default('demo-user'),
  type: z.enum(['fact', 'preference', 'person', 'project', 'note']).optional(),
  title: z.string().min(1),
  content: z.string().min(1),
  importance: z.number().min(1).max(10).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});
orbRouter.get('/memory', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? 'demo-user');
    const q = req.query.q ? String(req.query.q) : '';
    const memories = q ? await recall(userId, q, 20) : await listMemories(userId, 100);
    res.json({ durable: memoryDurable, memories });
  } catch (error) { next(error); }
});
orbRouter.post('/memory', async (req, res, next) => {
  try {
    const p = MemorySchema.parse(req.body ?? {});
    const memory = await remember(p.userId, p);
    res.json({ memory });
  } catch (error) { next(error); }
});
orbRouter.delete('/memory/:id', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? req.body?.userId ?? 'demo-user');
    res.json({ ok: await forget(userId, req.params.id) });
  } catch (error) { next(error); }
});

// ── Tasks (what EBE tracks; due tasks become attention signals) ─────────────
const TaskSchema = z.object({
  userId: z.string().min(1).default('demo-user'),
  title: z.string().min(1),
  description: z.string().optional(),
  domain: z.string().optional(),
  priority: z.number().min(1).max(10).optional(),
  dueAt: z.string().optional()
});
orbRouter.get('/tasks', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? 'demo-user');
    const status = req.query.status as TaskStatus | undefined;
    res.json({ durable: taskDurable, tasks: await listTasks(userId, status) });
  } catch (error) { next(error); }
});
orbRouter.post('/tasks', async (req, res, next) => {
  try {
    const p = TaskSchema.parse(req.body ?? {});
    res.json({ task: await createTask(p.userId, p) });
  } catch (error) { next(error); }
});
orbRouter.post('/tasks/:id/complete', async (req, res, next) => {
  try {
    const userId = String(req.body?.userId ?? 'demo-user');
    const task = await completeTask(userId, req.params.id);
    if (!task) return res.status(404).json({ error: 'task not found' });
    res.json({ task });
  } catch (error) { next(error); }
});
orbRouter.post('/tasks/:id/reopen', async (req, res, next) => {
  try {
    const userId = String(req.body?.userId ?? 'demo-user');
    const task = await reopenTask(userId, req.params.id);
    if (!task) return res.status(404).json({ error: 'task not found' });
    res.json({ task });
  } catch (error) { next(error); }
});
orbRouter.delete('/tasks/:id', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? req.body?.userId ?? 'demo-user');
    res.json({ ok: await deleteTask(userId, req.params.id) });
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
