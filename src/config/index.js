require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbFile: process.env.DB_FILE || './data/todos.json',
};

module.exports = config;
