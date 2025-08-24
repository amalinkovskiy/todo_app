const express = require('express');
const todoController = require('../controllers/todo.controller');

const router = express.Router();

// Роуты только для тестовой среды
if (process.env.NODE_ENV === 'test') {
  // DELETE all todos
  router.delete('/clear', todoController.clearAllTodos);
  
  // GET test status
  router.get('/status', (req, res) => {
    res.json({ status: 'test environment active' });
  });
}

module.exports = router;
