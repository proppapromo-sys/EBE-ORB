import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { orbRouter } from './routes/orb.js';
import { loadPlatformKeys } from './services/platformKeys.js';
import { handleWebhook } from './services/billing.js';

// Keep the server alive: a single unexpected async error must never crash-loop the whole app.
// Log it loudly and keep serving (so one bad request or integration can't take ORB down).
process.on('unhandledRejection', (reason) => console.error('[unhandledRejection]', reason));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

// Pull any owner-set AI keys (set from Settings) into memory before serving requests.
void loadPlatformKeys();

const app = express();
app.use(cors());

// Stripe webhook needs the RAW body for signature verification — mount it before express.json().
app.post('/api/orb/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const out = await handleWebhook(req.body as Buffer, req.header('stripe-signature'));
    res.json(out);
  } catch (err) {
    console.error('[billing] webhook error:', err instanceof Error ? err.message : err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'webhook error' });
  }
});

app.use(express.json({ limit: '2mb' }));
app.use('/api/orb', orbRouter);

// Serve the ORB web face (apps/web) so `npm run dev:api` → open http://localhost:PORT is fully live.
const webDir = join(dirname(fileURLToPath(import.meta.url)), '../../web');
app.use(express.static(webDir));

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => {
  console.log(`EBE ORB running on http://localhost:${port}`);
  console.log(`  • web face   →  http://localhost:${port}/`);
  console.log(`  • API health →  http://localhost:${port}/api/orb/health`);
});
