import type { OrbConnector } from '../types/orb.js';
import { GmailConnector } from './gmail.js';
import { CalendarConnector } from './calendar.js';
import { AmazonSellerConnector } from './amazonSeller.js';
import { StocksConnector } from './stocks.js';
import { EbeVenueConnector } from './ebeVenue.js';
import { TasksConnector } from './tasks.js';
import { WeatherConnector } from './weather.js';
import { ReservationsConnector } from './reservations.js';
import { IntegrationConnector } from './integration.js';
import { INTEGRATIONS } from '../services/integrations.js';

export const connectors: OrbConnector[] = [
  new GmailConnector(),
  new CalendarConnector(),
  new AmazonSellerConnector(),
  new StocksConnector(),
  new EbeVenueConnector(),
  new TasksConnector(),
  new WeatherConnector(),
  new ReservationsConnector(),
  // Customer self-connect integrations (Shopify, Stripe, …) — one connector per catalog entry.
  ...INTEGRATIONS.map((i) => new IntegrationConnector(i.provider, i.domain))
];

export function getConnector(name: string) {
  return connectors.find((connector) => connector.name === name);
}
