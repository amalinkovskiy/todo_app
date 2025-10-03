import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import config from '../src/config';
import todoRoutes from '../src/api/todo.routes';
import testRoutes from '../src/api/test.routes';
import { errorHandler, notFound } from '../src/middlewares/errorHandler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Lightweight request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = (durationNs / 1e6).toFixed(1);
    if (req.path === '/health') return;
    console.log(`[req] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });
  next();
});

// Routes
app.use('/api/todos', todoRoutes);
app.use('/api/test', testRoutes);

// Health check
app.get('/health', async (req: Request, res: Response) => {
  const todoService = (await import('../src/services/todo.service')).default;
  try {
    const result = await todoService.healthCheck();
    const statusCode = result.db ? 200 : 503;
    res.setHeader('X-Storage-Mode', result.storage || 'unknown');
    res.setHeader('X-DB-Fallback', String(result.fallbackActivated || false));
    if (result.lastError) res.setHeader('X-Last-Db-Error', encodeURIComponent(result.lastError.slice(0,120)));
    if (process.env.DEBUG_HEALTH === '1') {
      res.setHeader('X-Conn-Env', process.env.POSTGRES_URL ? 'POSTGRES_URL' : (process.env.DATABASE_URL ? 'DATABASE_URL' : 'none'));
    }
    res.status(statusCode).json({
      status: result.db ? 'ok' : 'degraded',
      db: result.db,
      storage: result.storage,
      fallbackActivated: result.fallbackActivated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Basic diagnostic endpoint
app.get('/diag', (req: Request, res: Response) => {
  res.json({
    status: 'diag-ok',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    },
    timestamp: new Date().toISOString()
  });
});

// Fallback route for SPA
app.get('*', (req: Request, res: Response): void => {
  if (req.path.startsWith('/api/') || path.extname(req.path)) {
    res.status(404).json({ message: 'API endpoint not found' });
    return;
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Export for Vercel serverless
export default app;
