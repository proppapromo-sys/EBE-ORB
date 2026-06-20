import { BaseConnector } from './base.js';
import type { OrbSignalInput } from '../types/orb.js';

export class AmazonSellerConnector extends BaseConnector {
  constructor() {
    super('amazon_seller', 'commerce');
  }

  async signals(_userId: string): Promise<OrbSignalInput[]> {
    return [
      {
        id: 'amz-stockout-risk',
        name: 'Best-seller stocks out in 6 days',
        description: 'LED strip lights (P1) will stock out in 6 days at current velocity — reorder.',
        domain: 'commerce',
        category: 'inventory',
        riskLevel: 'high',
        urgency: 0.8,
        impact: 0.85,
        effort: 0.35,
        confidence: 0.75,
        toolName: 'amazon.createReorder',
      },
      {
        id: 'amz-return-leak',
        name: 'Return rate spiking on apparel SKU',
        description: 'Graphic tee (M1) returns at 24% vs 12% category norm — margin leak.',
        domain: 'commerce',
        category: 'returns',
        riskLevel: 'medium',
        urgency: 0.6,
        impact: 0.55,
        effort: 0.3,
        confidence: 0.7,
        toolName: 'amazon.flagListing',
      },
    ];
  }
}
