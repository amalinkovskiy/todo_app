import express from 'express';
import todoController from '../controllers/todo.controller';
import {
  createTodoSchema,
  updateTodoSchema,
  todoParamsSchema,
  validateBody,
  validateParams
} from '../validators/todo.validator';

const router = express.Router();

// GET all todos
router.get('/', todoController.getAllTodos);

// GET single todo by uuid
router.get('/:uuid', 
  validateParams(todoParamsSchema),
  todoController.getTodoByUuid
);

// POST new todo
router.post('/', 
  validateBody(createTodoSchema),
  todoController.createTodo
);

// PUT update todo by uuid (full update)
router.put('/:uuid', 
  validateParams(todoParamsSchema),
  validateBody(updateTodoSchema),
  todoController.updateTodo
);

// PATCH update todo by uuid (partial update)
router.patch('/:uuid', 
  validateParams(todoParamsSchema),
  validateBody(updateTodoSchema),
  todoController.updateTodo
);

// DELETE todo by uuid
router.delete('/:uuid', 
  validateParams(todoParamsSchema),
  todoController.deleteTodo
);

// DELETE all todos (for testing purposes)
router.delete('/', todoController.clearAllTodos);

export default router;