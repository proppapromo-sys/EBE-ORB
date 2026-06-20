import type { OrbConnector } from '../types/orb.js';
import { GmailConnector } from './gmail.js';
import { CalendarConnector } from './calendar.js';
import { AmazonSellerConnector } from './amazonSeller.js';
import { StocksConnector } from './stocks.js';
import { EbeVenueConnector } from './ebeVenue.js';

export const connectors: OrbConnector[] = [
  new GmailConnector(),
  new CalendarConnector(),
  new AmazonSellerConnector(),
  new StocksConnector(),
  new EbeVenueConnector()
];

export function getConnector(name: string) {
  return connectors.find((connector) => connector.name === name);
}
