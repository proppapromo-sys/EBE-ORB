import { completeOrbPrompt } from '../services/openai.js';
import { connectors } from '../connectors/index.js';
import { runOrbCycle, type OrbCycleReport } from '../genome/orbBranch.js';
import { createJournal } from '../services/journalStore.js';
import { runCouncil } from '../brains/council.js';
import type { ConnectorResult, OrbAction, OrbInsight } from '../types/orb.js';

// ORB runs on the Universal Genome. The five laws are not advice — they are the gate.
const SYSTEM_PROMPT = `You are ORB, the user's Digital Chief of Staff, running on the Universal Genome.
You are not a chatbot. You observe connected systems, prioritize what matters, recommend actions,
and only execute high-risk actions after approval.

Obey the five laws of the genome at all times:
1. Risk-first, not prediction-first — survive before you win.
2. Edge = your number vs the world's number — no edge, no action.
3. Forward-validate before real stakes — trust is earned on the record.
4. Recognise + remember, don't predict — graduate patterns only once proven.
5. Confirm-first, never chase — high-risk actions wait for the owner's approval.

Be practical, direct, and focused on the user's life, businesses, investments, and commerce platforms.`;

function scorePriority(urgency: number, impact: number, effort: number, confidence: number) {
  return urgency + impact - effort + confidence;
}

export async function gatherContext(userId: string): Promise<ConnectorResult[]> {
  const results = await Promise.all(connectors.map((connector) => connector.pull(userId)));
  return results;
}

/**
 * Ask ORB. By default this convenes the full Multi-Model Council and returns the
 * ORB-Finalizer's single clean answer; `approvalRequired` stays code-computed from the cycle.
 * Pass { council: false } for a single-model answer (the lightweight path).
 */
export async function askOrb(
  userId: string,
  message: string,
  opts: { council?: boolean; documents?: string; images?: string[] } = {}
) {
  const context = await gatherContext(userId);

  if (opts.council === false) {
    const cycle = await runOrbCycle(connectors, userId, { journal: createJournal(userId) });
    const prompt = `User request: ${message}

Connected system context:
${JSON.stringify(context, null, 2)}

Genome cycle — risk-gated, prioritized actions (highest edge first):
${JSON.stringify(cycle.actions, null, 2)}

Respond as ORB with priorities, recommended actions, and approval notes where needed.
Flag every action whose requiresApproval is true — never imply it can run on its own.`;
    const answer = await completeOrbPrompt(SYSTEM_PROMPT, prompt);
    return { mode: 'single' as const, answer, context, cycle };
  }

  const council = await runCouncil(userId, message, { documents: opts.documents, images: opts.images });
  return {
    mode: 'council' as const,
    answer: council.finalAnswer,
    context,
    cycle: council.cycle,
    approvalRequired: council.approvalRequired,
    council: council.council,
    fullyConfigured: council.fullyConfigured
  };
}

/**
 * The morning briefing: one genome cycle turned into a human-readable summary.
 * Pure-code fallback when AI is not configured, so ORB always produces something.
 */
export async function dailyBriefing(userId: string): Promise<{ report: OrbCycleReport; summary: string }> {
  const report = await runOrbCycle(connectors, userId, { journal: createJournal(userId) });
  const approvals = report.actions.filter((a) => a.requiresApproval);
  const auto = report.actions.filter((a) => !a.requiresApproval);
  const lines = [
    `ORB daily briefing — ${report.actions.length} actions surfaced (${approvals.length} need approval).`,
    ...report.actions.map(
      (a, i) =>
        `${i + 1}. [${a.riskLevel.toUpperCase()}${a.requiresApproval ? ' · approve' : ' · auto'}] ${a.title}`
    )
  ];
  if (auto.length) lines.push(`Auto-safe: ${auto.map((a) => a.title).join(', ')}.`);
  return { report, summary: lines.join('\n') };
}

export function createInsight(input: Partial<OrbInsight>): OrbInsight {
  return {
    title: input.title ?? 'Untitled Insight',
    summary: input.summary ?? '',
    domain: input.domain ?? 'personal',
    priorityScore: input.priorityScore ?? scorePriority(5, 5, 2, 5),
    evidence: input.evidence ?? [],
    recommendedActions: input.recommendedActions ?? []
  };
}

export function createAction(action: Omit<OrbAction, 'requiresApproval'>): OrbAction {
  const requiresApproval = action.riskLevel !== 'low';
  return { ...action, requiresApproval };
}
