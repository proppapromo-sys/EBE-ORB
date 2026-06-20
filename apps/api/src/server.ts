import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { orbRouter } from './routes/orb.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/api/orb', orbRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`EBE ORB API running on http://localhost:${port}`));
