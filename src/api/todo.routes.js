const express = require('express');
const todoController = require('../controllers/todo.controller');

const router = express.Router();

// GET all todos
router.get('/', todoController.getAllTodos);

// GET single todo by uuid
router.get('/:uuid', todoController.getTodoByUuid);

// POST new todo
router.post('/', todoController.createTodo);

// PUT update todo by uuid (full update)
router.put('/:uuid', todoController.updateTodo);

// PATCH update todo by uuid (partial update)
router.patch('/:uuid', todoController.updateTodo);

// DELETE todo by uuid
router.delete('/:uuid', todoController.deleteTodo);

module.exports = router;
