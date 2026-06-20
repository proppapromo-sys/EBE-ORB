import type { OrbConnector, ConnectorStatus, ConnectorResult, OrbDomain, OrbAction } from '../types/orb.js';

export abstract class BaseConnector implements OrbConnector {
  constructor(public name: string, public domain: OrbDomain) {}

  async status(_userId: string): Promise<ConnectorStatus> {
    return 'needs_auth';
  }

  async pull(userId: string): Promise<ConnectorResult> {
    return {
      connector: this.name,
      status: await this.status(userId),
      data: { message: `${this.name} connector is not implemented yet.` },
      checkedAt: new Date().toISOString()
    };
  }

  async execute(userId: string, action: OrbAction): Promise<ConnectorResult> {
    return {
      connector: this.name,
      status: await this.status(userId),
      data: { message: 'Action queued for approval or implementation.', action },
      checkedAt: new Date().toISOString()
    };
  }
}
