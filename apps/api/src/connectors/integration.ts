/**
 * integration.ts — a connector backed by customer-supplied API keys (Shopify, Stripe, …).
 *
 * One class drives every self-connect integration: status comes from whether the customer has
 * saved credentials, and signals come from the live read in services/integrations.ts. No sample
 * fallback here — if it's connected the data is real; if it isn't, it simply stays quiet.
 */
import { BaseConnector } from './base.js';
import type { OrbSignalInput, ConnectorStatus, OrbDomain } from '../types/orb.js';
import { getCredential } from '../services/credentialStore.js';
import { liveSignals } from '../services/integrations.js';

export class IntegrationConnector extends BaseConnector {
  constructor(public provider: string, domain: OrbDomain) {
    super(provider, domain);
  }

  async status(userId: string): Promise<ConnectorStatus> {
    return (await getCredential(userId, this.provider)) ? 'connected' : 'needs_auth';
  }

  async signals(userId: string): Promise<OrbSignalInput[]> {
    return liveSignals(this.provider, userId);
  }
}
