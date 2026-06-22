import { BaseConnector } from './base.js';
import type { OrbSignalInput } from '../types/orb.js';

export class EbeVenueConnector extends BaseConnector {
  constructor() {
    super('ebe_venue_os', 'business');
  }

  async signals(_userId: string): Promise<OrbSignalInput[]> {
    return [
      {
        id: 'venue-charcoal-runway',
        name: 'Coconut charcoal runs out in 19 days',
        description: '480 cubes/mo consumed — 19 days of cover left. Reorder a 1000-pack.',
        domain: 'business',
        category: 'supplies',
        riskLevel: 'medium',
        urgency: 0.55,
        impact: 0.5,
        effort: 0.25,
        confidence: 0.8,
        toolName: 'venue.reorderSupply',
      },
      {
        id: 'venue-summary',
        name: 'Nightly venue summary ready',
        description: 'Draft tonight\'s sales + supplies recap for review.',
        domain: 'business',
        category: 'report',
        riskLevel: 'low',
        urgency: 0.3,
        impact: 0.2,
        effort: 0.1,
        confidence: 0.95,
        toolName: 'venue.draftSummary',
      },
    ];
  }
}
