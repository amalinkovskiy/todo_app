const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const todoRoutes = require('./api/todo.routes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/todos', todoRoutes);

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

module.exports = app;
