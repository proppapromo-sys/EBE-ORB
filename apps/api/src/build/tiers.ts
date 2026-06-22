/**
 * tiers.ts — "efficiency based on tier." Build power scales with the customer's plan, on the
 * same dial the council already uses. Higher tier = more organs run, more files, bigger builds,
 * and (top tiers) ORB deploys it live.
 */
import type { CouncilLevel } from '../brains/council.js';
import { getPlan, type PlanId } from '../billing/plans.js';

export type BuildDepth = 'mockup' | 'onepage' | 'multipage' | 'app' | 'deploy';

export type BuildCapability = {
  plan: PlanId;
  label: string;
  depth: BuildDepth;
  /** Max files ORB will generate at this tier. */
  maxFiles: number;
  /** Whether ORB may run the full review organ (design ↔ code agreement). */
  review: boolean;
  /** Whether ORB may deploy the result live (top tiers only). */
  canDeploy: boolean;
  /** Council escalation used by the build's reasoning organs. */
  council: CouncilLevel;
};

const CAP_BY_PLAN: Record<PlanId, BuildCapability> = {
  free:        { plan: 'free',         label: 'Concept / 1-page mockup',        depth: 'mockup',    maxFiles: 1,  review: false, canDeploy: false, council: 'standard'  },
  personal:    { plan: 'personal',     label: 'Single-page site',               depth: 'onepage',   maxFiles: 3,  review: false, canDeploy: false, council: 'important' },
  pro:         { plan: 'pro',          label: 'Multi-page site + small web app', depth: 'multipage', maxFiles: 10, review: true,  canDeploy: false, council: 'high'      },
  entrepreneur:{ plan: 'entrepreneur', label: 'Business site / dashboard / store', depth: 'app',     maxFiles: 18, review: true,  canDeploy: false, council: 'high'      },
  executive:   { plan: 'executive',    label: 'Full multi-AI build, deploy-ready', depth: 'deploy',  maxFiles: 30, review: true,  canDeploy: true,  council: 'critical'  },
  enterprise:  { plan: 'enterprise',   label: 'Everything + mobile + auto-deploy', depth: 'deploy',  maxFiles: 60, review: true,  canDeploy: true,  council: 'critical'  }
};

export function buildCapability(planId?: string): BuildCapability {
  return CAP_BY_PLAN[getPlan(planId).id];
}
