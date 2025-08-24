const express = require('express');
const Joi = require('joi');
const todoController = require('../controllers/todo.controller');
const {
  createTodoSchema,
  updateTodoSchema,
  uuidSchema,
  validateBody,
  validateParams
} = require('../validators/todo.validator');

const router = express.Router();

// GET all todos
router.get('/', todoController.getAllTodos);

// GET single todo by uuid
router.get('/:uuid', 
  validateParams(Joi.object({ uuid: uuidSchema })),
  todoController.getTodoByUuid
);

// POST new todo
router.post('/', 
  validateBody(createTodoSchema),
  todoController.createTodo
);

// PUT update todo by uuid (full update)
router.put('/:uuid', 
  validateParams(Joi.object({ uuid: uuidSchema })),
  validateBody(updateTodoSchema),
  todoController.updateTodo
);

// PATCH update todo by uuid (partial update)
router.patch('/:uuid', 
  validateParams(Joi.object({ uuid: uuidSchema })),
  validateBody(updateTodoSchema),
  todoController.updateTodo
);

// DELETE all todos (only for testing) - должен быть ДО dynamic route /:uuid
if (process.env.NODE_ENV === 'test') {
  router.delete('/clear-all', todoController.clearAllTodos);
}

// DELETE todo by uuid
router.delete('/:uuid', 
  validateParams(Joi.object({ uuid: uuidSchema })),
  todoController.deleteTodo
);

module.exports = router;
