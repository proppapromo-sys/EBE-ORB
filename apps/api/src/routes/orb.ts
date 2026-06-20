import { Router } from 'express';
import { z } from 'zod';
import { askOrb, gatherContext, createAction, dailyBriefing } from '../agents/masterAgent.js';
import { connectors, getConnector } from '../connectors/index.js';
import { runOrbCycle } from '../genome/orbBranch.js';

export const orbRouter = Router();

const CycleSchema = z.object({
  userId: z.string().min(1).default('demo-user'),
  bankroll: z.number().positive().optional(),
  minEdge: z.number().min(0).max(1).optional()
});

const AskSchema = z.object({
  userId: z.string().min(1).default('demo-user'),
  message: z.string().min(1)
});

orbRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'EBE ORB API', timestamp: new Date().toISOString() });
});

orbRouter.get('/connectors', (_req, res) => {
  res.json({ connectors: connectors.map((c) => ({ name: c.name, domain: c.domain })) });
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
    const result = await askOrb(parsed.userId, parsed.message);
    res.json(result);
  } catch (error) { next(error); }
});

// Run one ORB genome cycle: connectors → edge gate → eyes → risk → confirm-first actions.
orbRouter.post('/cycle', async (req, res, next) => {
  try {
    const parsed = CycleSchema.parse(req.body ?? {});
    const report = await runOrbCycle(connectors, parsed.userId, {
      bankroll: parsed.bankroll,
      minEdge: parsed.minEdge
    });
    res.json(report);
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
