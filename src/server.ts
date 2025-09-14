import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import config from './config';
import todoRoutes from './api/todo.routes';
import testRoutes from './api/test.routes';
import { errorHandler, notFound } from './middlewares/errorHandler';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Lightweight request logging (method, path, status, duration)
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  // When response finishes, log details
  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = (durationNs / 1e6).toFixed(1);
    // Avoid noisy logs for health checks (optional)
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
  const todoService = (await import('./services/todo.service')).default;
  try {
    const result = await todoService.healthCheck();
    const statusCode = result.db ? 200 : 503;
    // Add diagnostic headers (non-sensitive)
    res.setHeader('X-Storage-Mode', result.storage || 'unknown');
    res.setHeader('X-DB-Fallback', String(result.fallbackActivated || false));
    if (result.lastError) res.setHeader('X-Last-Db-Error', encodeURIComponent(result.lastError.slice(0,120)));
    if (process.env.DEBUG_HEALTH === '1') {
      // Expose which connection env was detected (not the value)
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

// Basic diagnostic endpoint (no sensitive data, serverless debugging)
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
  // Don't serve index.html for API routes or explicit extensions
  if (req.path.startsWith('/api/') || path.extname(req.path)) {
    res.status(404).json({ message: 'API endpoint not found' });
    return;
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const port = config.port;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;