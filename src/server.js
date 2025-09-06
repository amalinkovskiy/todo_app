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
  const result = await todoService.healthCheck();
  const statusCode = result.ok && result.db ? 200 : 503;
  res.status(statusCode).json({
    status: result.ok ? 'ok' : 'error',
    db: result.db,
    timestamp: new Date().toISOString(),
    ...(result.error ? { error: result.error } : {})
  });
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
