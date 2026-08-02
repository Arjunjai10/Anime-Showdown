import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import rosterRoutes from './routes/roster.js';
import teamRoutes from './routes/teams.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/roster', rosterRoutes);
  app.use('/api/teams', teamRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Global error handler
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[API Error]', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
