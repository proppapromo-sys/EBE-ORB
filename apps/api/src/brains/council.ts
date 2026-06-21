/**
 * council.ts — the ORB Multi-Model Council orchestrator.
 *
 * Flow (genome-faithful):
 *   0. Genome cycle runs FIRST — the code-level risk gate produces the only authoritative,
 *      risk-gated action list. Everything the council says is layered on top of this; it can
 *      inform, but it cannot loosen the gate.
 *   1. GPT-Executive       — first reasoning pass over request + cycle
 *   2. GPT-Operations      — execution plan from that reasoning
 *   3. GPT-Risk            — challenges the answer (advisory flags only)
 *   4. Claude-Evaluator    — deep review + document understanding
 *   5. Gemini-VisualVerifier — multimodal confirmation / final agreement check
 *   6. ORB-Finalizer       — combines everything into one clean response
 *
 * The Finalizer writes the prose, but `approvalRequired` is computed in code from the genome
 * cycle — no brain can flip it. The Brain proposes; the Heart disposes.
 */
import { connectors } from '../connectors/index.js';
import { runOrbCycle, type OrbCycleReport } from '../genome/orbBranch.js';
import { createJournal } from '../services/journalStore.js';
import { getProviderClient } from './providers.js';
import { BRAINS, COUNCIL_ORDER } from './brains.js';
import { saveCouncilRun } from '../services/councilStore.js';
import { recall, listMemories } from '../services/memoryStore.js';
import { personaTone, personaProvider } from './personality.js';
import type { BrainRole, BrainResponse, BrainProvider } from './types.js';

// Model to use when ORB's voice is routed to a given provider (persona feel; still one ORB).
const VOICE_MODEL: Record<BrainProvider, string> = {
  openai: 'gpt-4.1', anthropic: 'claude-sonnet-4-6', gemini: 'gemini-2.5-flash'
};
/** Pick a configured provider for ORB's voice: preferred persona provider, else any configured. */
function voiceProvider(want?: BrainProvider): BrainProvider {
  const order: BrainProvider[] = [want, 'anthropic', 'openai', 'gemini'].filter(Boolean) as BrainProvider[];
  for (const p of order) if (getProviderClient(p).configured) return p;
  return BRAINS.finalizer.provider;
}

async function runBrain(
  role: BrainRole,
  task: string,
  context: unknown,
  images?: string[],
  extraSystem?: string,
  override?: { provider: BrainProvider; model: string }
): Promise<BrainResponse> {
  const spec = BRAINS[role];
  const provider = override?.provider ?? spec.provider;
  const model = override?.model ?? spec.model;
  const client = getProviderClient(provider);
  const user = `TASK:\n${task}\n\nCONTEXT:\n${JSON.stringify(context, null, 2)}`;
  const system = extraSystem ? `${spec.system}\n\n${extraSystem}` : spec.system;
  try {
    const { text, ok, note } = await client.complete({ model, system, user, images });
    return { role, label: spec.label, provider, model, output: text, ok, note };
  } catch (err) {
    return {
      role,
      label: spec.label,
      provider,
      model,
      output: '',
      ok: false,
      note: err instanceof Error ? err.message : 'brain error'
    };
  }
}

export type CouncilResult = {
  request: string;
  generatedAt: string;
  /** The authoritative, code-gated genome cycle. */
  cycle: OrbCycleReport;
  /** Computed in code from the cycle — the council cannot change this. */
  approvalRequired: { count: number; titles: string[] };
  /** Each council member's contribution, in order. */
  council: BrainResponse[];
  /** ORB-Finalizer's single clean response. */
  finalAnswer: string;
  /** True only if every brain ran with its provider configured. */
  fullyConfigured: boolean;
  /** Id of the persisted run in the council log (null if logging was unavailable). */
  runId?: string | null;
  /** Escalation level used + which brains actually ran (cost control). */
  level: CouncilLevel;
  ran: BrainRole[];
};

export type CouncilLevel = 'standard' | 'important' | 'high' | 'critical';

// Which brains run at each level (cost control — don't run 5 models on a simple ask).
const ROLES_BY_LEVEL: Record<CouncilLevel, BrainRole[]> = {
  standard:  ['finalizer'],                                              // 1 model
  important: ['executive', 'finalizer'],                                 // GPT + Claude
  high:      ['executive', 'risk', 'evaluator', 'visual', 'finalizer'],  // + risk + Gemini
  critical:  ['executive', 'operations', 'risk', 'evaluator', 'visual', 'finalizer'] // full council
};
const LEVEL_ORDER: CouncilLevel[] = ['standard', 'important', 'high', 'critical'];
function capLevel(want: CouncilLevel, max?: CouncilLevel): CouncilLevel {
  if (!max) return want;
  return LEVEL_ORDER[Math.min(LEVEL_ORDER.indexOf(want), LEVEL_ORDER.indexOf(max))];
}

/** Risk-first auto-routing: escalate the council based on what the REQUEST is asking for. */
function detectLevel(request: string): CouncilLevel {
  const q = request.toLowerCase();
  const critical = /\b(pay|payroll|wire|transfer|invest|trade|sell|buy|purchase|price|refund|fire|terminate|legal|contract|delete|cancel)\b|\$\d/.test(q);
  const high = /\b(decide|should i|recommend|strategy|negotiate|hire|approve|risk|compare|choose)\b/.test(q);
  const important = /\b(schedule|reschedule|email|draft|send|message|reserve|book|order|reorder|invoice|post|remind)\b/.test(q);
  if (critical) return 'critical';
  if (high) return 'high';
  if (important) return 'important';
  return 'standard';
}

export async function runCouncil(
  userId: string,
  request: string,
  opts: { images?: string[]; documents?: string; level?: CouncilLevel; maxLevel?: CouncilLevel; personality?: string; customPersona?: string } = {}
): Promise<CouncilResult> {
  // 0) The Heart runs first — code-level risk gate, the only authority over actions.
  const cycle = await runOrbCycle(connectors, userId, { journal: createJournal(userId) });
  const approvals = cycle.actions.filter((a) => a.requiresApproval);

  // Choose how many brains to convene (cost control), capped by the plan's max.
  const level = capLevel(opts.level ?? detectLevel(request), opts.maxLevel);
  const roles = new Set<BrainRole>(ROLES_BY_LEVEL[level]);

  // Law 4 for the assistant: recall what EBE knows about this owner before reasoning.
  const memories = [...(await recall(userId, request, 6)), ...(await listMemories(userId, 6))];
  const seen = new Set<string>();
  const memory = memories.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)))
    .slice(0, 8).map((m) => ({ type: m.type, title: m.title, content: m.content }));

  const base = { request, memory, cycle: { actions: cycle.actions, vetoed: cycle.vetoed, passed: cycle.passed } };
  const transcript: BrainResponse[] = [];
  const out: Record<string, string> = {};
  const run = async (role: BrainRole, task: string, ctx: unknown, images?: string[]) => {
    if (!roles.has(role)) return;
    const b = await runBrain(role, task, ctx, images);
    transcript.push(b); out[role] = b.output;
  };

  await run('executive', request, { ...base, documents: opts.documents });
  await run('operations', 'Turn the executive reasoning into an execution plan.', { ...base, executiveReasoning: out.executive });
  await run('risk', 'Challenge the plan. Find mistakes, conflicts, and law violations.', { ...base, executiveReasoning: out.executive, executionPlan: out.operations });
  await run('evaluator', 'Deeply review the council so far and any documents.', { request, documents: opts.documents, executiveReasoning: out.executive, executionPlan: out.operations, riskChallenge: out.risk });
  await run('visual', 'Confirm visuals/data and give a final agreement check (AGREE/DISAGREE).', { request, executionPlan: out.operations, evaluation: out.evaluator, imagesProvided: (opts.images ?? []).length }, opts.images);
  // ORB-Finalizer (the voice) always runs — it answers from whatever brains convened.
  const vp = voiceProvider(personaProvider(opts.personality));
  const finalizer = await runBrain('finalizer', 'Combine everything into one clean, owner-ready response.', {
    request, memory, approvalRequired: approvals.map((a) => a.title), gatedActions: cycle.actions,
    executiveReasoning: out.executive, executionPlan: out.operations, riskChallenge: out.risk,
    evaluation: out.evaluator, visualConfirmation: out.visual
  }, undefined, personaTone(opts.personality, opts.customPersona), { provider: vp, model: VOICE_MODEL[vp] });
  transcript.push(finalizer);

  const result: CouncilResult = {
    request,
    generatedAt: new Date().toISOString(),
    cycle,
    approvalRequired: { count: approvals.length, titles: approvals.map((a) => a.title) },
    council: transcript,
    finalAnswer: finalizer.output,
    fullyConfigured: transcript.every((b) => b.ok),
    level,
    ran: transcript.map((b) => b.role)
  };
  result.runId = await saveCouncilRun(userId, result); // ORB logs everything (best-effort)
  return result;
}
