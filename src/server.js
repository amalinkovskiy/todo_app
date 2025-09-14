const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const config = require('./config');
const todoRoutes = require('./api/todo.routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));


// Lightweight request logging (method, path, status, duration)
app.use((req, res, next) => {
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

// Health check
app.get('/health', async (req, res) => {
  const todoService = require('./services/todo.service');
  try {
    const result = await todoService.healthCheck();
    const statusCode = result.ok && result.db ? 200 : 503;
    // Add diagnostic headers (non-sensitive)
    res.setHeader('X-Storage-Mode', result.storage || 'unknown');
    res.setHeader('X-DB-Fallback', String(result.fallbackActivated || false));
    if (result.lastDbError) res.setHeader('X-Last-Db-Error', encodeURIComponent(result.lastDbError.slice(0,120)));
    if (process.env.DEBUG_HEALTH === '1') {
      // Expose which connection env was detected (not the value)
      res.setHeader('X-Conn-Env', process.env.POSTGRES_URL ? 'POSTGRES_URL' : (process.env.DATABASE_URL ? 'DATABASE_URL' : 'none'));
    }
    return res.status(statusCode).json({
      status: result.ok ? 'ok' : 'error',
      db: result.db,
      storage: result.storage,
      fallbackActivated: result.fallbackActivated,
      timestamp: new Date().toISOString(),
      ...(result.error ? { error: result.error } : {}),
      ...(result.lastDbError && !result.error ? { lastDbError: result.lastDbError } : {})
    });
  } catch (err) {
    console.error('[health] unexpected error', err);
    res.status(500).json({ status: 'error', message: 'health check failed', timestamp: new Date().toISOString() });
  }
});

// Simplified diagnostic endpoint (bypasses health complexity)
app.get('/diag', (req, res) => {
  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL
    };
    res.json({ status: 'diag-ok', env, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'diag-error', error: err.message });
  }
});

// Test routes (only in test environment)
if (process.env.NODE_ENV === 'test') {
  const testRoutes = require('./api/test.routes');
  app.use('/api/test', testRoutes);
}

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  // Initialize the database service when server starts (but not during tests)
  if (process.env.NODE_ENV !== 'test') {
    const todoService = require('./services/todo.service');
    await todoService.init();
  }
  
  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server only if this file is run directly
if (require.main === module) {
  startServer();
}

// Export the app for Vercel
module.exports = app;
