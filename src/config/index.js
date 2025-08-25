const dotenv = require('dotenv');

// Load .env.test if in test environment, otherwise load .env
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: envFile });

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbFile: process.env.DB_FILE || './data/todos.json',
};

module.exports = config;
