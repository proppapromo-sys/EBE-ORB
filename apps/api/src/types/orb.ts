export type OrbDomain =
  | 'personal'
  | 'business'
  | 'investment'
  | 'commerce'
  | 'communication'
  | 'calendar'
  | 'knowledge'
  | 'finance';

export type RiskLevel = 'low' | 'medium' | 'high';

export type OrbAction = {
  id?: string;
  title: string;
  description: string;
  domain: OrbDomain;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  toolName?: string;
  payload?: Record<string, unknown>;
};

export type OrbInsight = {
  title: string;
  summary: string;
  domain: OrbDomain;
  priorityScore: number;
  evidence?: string[];
  recommendedActions?: OrbAction[];
};

export type ConnectorStatus = 'connected' | 'needs_auth' | 'error' | 'disabled';

export type ConnectorResult = {
  connector: string;
  status: ConnectorStatus;
  data: unknown;
  checkedAt: string;
};

export interface OrbConnector {
  name: string;
  domain: OrbDomain;
  status(userId: string): Promise<ConnectorStatus>;
  pull(userId: string, options?: Record<string, unknown>): Promise<ConnectorResult>;
  execute?(userId: string, action: OrbAction): Promise<ConnectorResult>;
  /** Candidate signals this connector contributes to an ORB genome cycle (the EARS of ORB). */
  signals?(userId: string): Promise<OrbSignalInput[]>;
}

/** A signal a connector surfaces into the genome loop. */
export type OrbSignalInput = {
  id: string;
  name: string;
  description?: string;
  domain: OrbDomain;
  riskLevel: RiskLevel;
  urgency: number; // 0..1
  impact: number; // 0..1
  effort: number; // 0..1
  confidence: number; // 0..1
  baseline?: number; // ambient-noise threshold to beat
  toolName?: string;
  category?: string;
};
