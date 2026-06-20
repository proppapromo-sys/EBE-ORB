import { BaseConnector } from './base.js';
import type { OrbSignalInput } from '../types/orb.js';

export class StocksConnector extends BaseConnector {
  constructor() {
    super('stocks_portfolio', 'investment');
  }

  async signals(_userId: string): Promise<OrbSignalInput[]> {
    return [
      {
        id: 'stocks-rebalance',
        name: 'Portfolio drifted 8% from target',
        description: 'Tech allocation is 8% over target after the rally — trim to rebalance.',
        domain: 'investment',
        category: 'portfolio',
        riskLevel: 'high',
        urgency: 0.5,
        impact: 0.8,
        effort: 0.3,
        confidence: 0.6,
        toolName: 'stocks.placeOrder',
      },
    ];
  }
}
