/**
 * types.ts — the ORB Master System brain contracts.
 *
 * ORB orchestrates several AI models as specialized "brains/layers". Each brain is bound to a
 * provider + model + role, and is strictly ADVISORY: per the genome, AI lives inside organs and
 * is bounded by the five laws. The Brain proposes; the Heart (the code-level risk gate + the
 * confirm-first approval queue) disposes. No brain — and no number of agreeing brains — can
 * approve or execute a high-risk action. That stays in plain code, by design.
 */
export type BrainProvider = 'openai' | 'anthropic' | 'gemini';

export type BrainRole =
  | 'executive' // GPT-Executive — first reasoning pass; planning, strategy, daily assistant
  | 'operations' // GPT-Operations — execution plan; tasks, calendar, workflows
  | 'risk' // GPT-Risk — challenges the answer; mistakes, safety, conflicts (advisory)
  | 'evaluator' // Claude-Evaluator — deep review, long-document understanding, quality
  | 'visual' // Gemini-VisualVerifier — graphics, screenshots, multimodal confirmation
  | 'finalizer'; // ORB-Finalizer — combines results into one clean response

export type BrainSpec = {
  role: BrainRole;
  label: string;
  provider: BrainProvider;
  model: string;
  system: string;
};

export type BrainRequest = {
  /** What the brain is being asked to do. */
  task: string;
  /** Anything the brain should reason over (cycle report, prior brain outputs, documents). */
  context?: unknown;
  /** Image URLs or base64 data for the visual layer. */
  images?: string[];
};

export type BrainResponse = {
  role: BrainRole;
  label: string;
  provider: BrainProvider;
  model: string;
  output: string;
  /** false when the provider key is missing and the brain returned a degraded placeholder. */
  ok: boolean;
  note?: string;
};

export interface BrainProviderClient {
  provider: BrainProvider;
  configured: boolean;
  complete(opts: {
    model: string;
    system: string;
    user: string;
    images?: string[];
    maxTokens?: number;
  }): Promise<{ text: string; ok: boolean; note?: string }>;
}
