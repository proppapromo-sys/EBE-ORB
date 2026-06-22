/**
 * types.ts — the Universal Construction Genome's shared shapes.
 *
 * Same idea as the decision genome (one skeleton, many domains): every build — a marketing
 * site, a web app, a store, a mobile app — is the SAME organism. Only the "cells" (the
 * blueprint) differ. ORB takes a short brief, picks the proven blueprint, designs with Gemini,
 * architects + codes with GPT/Claude, and hands back real files. Each finished build sharpens
 * the library (recognise + remember).
 */

/** The four families of thing ORB can construct. All share one genome. */
export type BuildCategory = 'marketing' | 'webapp' | 'ecommerce' | 'mobile';

/** What enters the genome: a client's need, in plain words. */
export type BuildBrief = {
  /** Plain-language ask, e.g. "a booking site for a barbershop in Austin". */
  request: string;
  /** Optional explicit category; inferred from the request when omitted. */
  category?: BuildCategory;
  /** Optional brand direction so Gemini designs on-brand from the first pass. */
  brand?: {
    name?: string;
    palette?: string;     // e.g. "warm earth tones", or hex values
    vibe?: string;        // e.g. "premium, calm, minimal"
    logoNote?: string;
  };
  /** The client's subscription tier — caps depth, file count, and whether we can deploy. */
  plan?: string;
};

/** A proven skeleton — the reusable "cell" for one build family. */
export type Blueprint = {
  id: string;
  category: BuildCategory;
  name: string;
  summary: string;
  /** Recommended, opinionated tech stack. */
  stack: string[];
  /** Folder/file skeleton, as tree lines (the structural truth). */
  structure: string[];
  /** Standard components/screens this kind of build almost always needs. */
  components: string[];
  /** Sensible design-system defaults Gemini refines instead of inventing from zero. */
  designDefaults: { typography: string; spacing: string; motion: string; tone: string };
  /** What must be true before it ships. */
  launchChecklist: string[];
};

/** A single generated file in the delivered package. */
export type GeneratedFile = { path: string; contents: string };

/** One organ's output in the build pipeline (mirrors the council's BrainResponse). */
export type BuildStageResult = {
  organ: BuildOrgan;
  label: string;
  provider: string;
  model: string;
  output: string;
  ok: boolean;
  note?: string;
};

/** The seven organs of construction (one interface, any build). */
export type BuildOrgan =
  | 'brief'        // 📋 the need enters
  | 'blueprint'    // 🗂  proven skeleton selected
  | 'design'       // 🎨 Gemini — layout, look, design system
  | 'architecture' // 🏗  GPT/Claude — stack, structure, data model
  | 'code'         // ⌨️  GPT/Claude — the actual files
  | 'review'       // 🔎 council agreement check (design ↔ code)
  | 'deliver';     // 🚀 package or deploy live (tier-gated)

/** The finished organism. */
export type BuildResult = {
  request: string;
  category: BuildCategory;
  generatedAt: string;
  plan: string;
  /** Capability actually granted by the tier. */
  capability: { label: string; depth: string; maxFiles: number; canDeploy: boolean };
  blueprint: { id: string; name: string; stack: string[] };
  /** Human-readable design direction from Gemini. */
  design: string;
  /** Architecture / structure decisions from GPT+Claude. */
  architecture: string;
  /** The real, generated files (capped by tier). */
  files: GeneratedFile[];
  /** Optional council review (higher tiers only). */
  review?: string;
  /** How to run/deploy what was built. */
  deliver: string;
  /** Every organ's raw contribution, in order. */
  stages: BuildStageResult[];
  /** True only if every organ ran with its provider configured. */
  fullyConfigured: boolean;
};
