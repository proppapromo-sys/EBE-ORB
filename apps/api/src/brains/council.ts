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
import type { BrainRole, BrainResponse } from './types.js';

async function runBrain(
  role: BrainRole,
  task: string,
  context: unknown,
  images?: string[]
): Promise<BrainResponse> {
  const spec = BRAINS[role];
  const client = getProviderClient(spec.provider);
  const user = `TASK:\n${task}\n\nCONTEXT:\n${JSON.stringify(context, null, 2)}`;
  try {
    const { text, ok, note } = await client.complete({ model: spec.model, system: spec.system, user, images });
    return { role, label: spec.label, provider: spec.provider, model: spec.model, output: text, ok, note };
  } catch (err) {
    return {
      role,
      label: spec.label,
      provider: spec.provider,
      model: spec.model,
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
};

export async function runCouncil(
  userId: string,
  request: string,
  opts: { images?: string[]; documents?: string } = {}
): Promise<CouncilResult> {
  // 0) The Heart runs first — code-level risk gate, the only authority over actions.
  const cycle = await runOrbCycle(connectors, userId, { journal: createJournal(userId) });
  const approvals = cycle.actions.filter((a) => a.requiresApproval);

  const base = { request, cycle: { actions: cycle.actions, vetoed: cycle.vetoed, passed: cycle.passed } };
  const transcript: BrainResponse[] = [];

  // 1) GPT-Executive — first reasoning pass
  const executive = await runBrain('executive', request, { ...base, documents: opts.documents });
  transcript.push(executive);

  // 2) GPT-Operations — execution plan
  const operations = await runBrain('operations', 'Turn the executive reasoning into an execution plan.', {
    ...base,
    executiveReasoning: executive.output
  });
  transcript.push(operations);

  // 3) GPT-Risk — challenge the answer
  const risk = await runBrain('risk', 'Challenge the plan. Find mistakes, conflicts, and law violations.', {
    ...base,
    executiveReasoning: executive.output,
    executionPlan: operations.output
  });
  transcript.push(risk);

  // 4) Claude-Evaluator — deep review + documents
  const evaluator = await runBrain('evaluator', 'Deeply review the council so far and any documents.', {
    request,
    documents: opts.documents,
    executiveReasoning: executive.output,
    executionPlan: operations.output,
    riskChallenge: risk.output
  });
  transcript.push(evaluator);

  // 5) Gemini-VisualVerifier — multimodal confirmation / final agreement
  const visual = await runBrain(
    'visual',
    'Confirm visuals/data and give a final agreement check (AGREE/DISAGREE).',
    {
      request,
      executionPlan: operations.output,
      evaluation: evaluator.output,
      imagesProvided: (opts.images ?? []).length
    },
    opts.images
  );
  transcript.push(visual);

  // 6) ORB-Finalizer — combine into one clean response
  const finalizer = await runBrain('finalizer', 'Combine the entire council into one clean, owner-ready response.', {
    request,
    approvalRequired: approvals.map((a) => a.title),
    gatedActions: cycle.actions,
    executiveReasoning: executive.output,
    executionPlan: operations.output,
    riskChallenge: risk.output,
    evaluation: evaluator.output,
    visualConfirmation: visual.output
  });
  transcript.push(finalizer);

  const result: CouncilResult = {
    request,
    generatedAt: new Date().toISOString(),
    cycle,
    approvalRequired: { count: approvals.length, titles: approvals.map((a) => a.title) },
    council: transcript,
    finalAnswer: finalizer.output,
    fullyConfigured: transcript.every((b) => b.ok)
  };
  result.runId = await saveCouncilRun(userId, result); // ORB logs everything (best-effort)
  return result;
}
