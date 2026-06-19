import express, { Request, Response, NextFunction } from 'express';
import todoController from '../controllers/todo.controller';
import {
  createTodoSchema,
  updateTodoSchema,
  todoParamsSchema,
  validateBody,
  validateParams
} from '../validators/todo.validator';

const router = express.Router();
const allowTestDataReset = process.env.ALLOW_TEST_DATA_RESET === 'true';

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

// DELETE all todos. This is destructive and must only be enabled in safe test/stage environments.
router.delete('/', (req: Request, res: Response, next: NextFunction) => {
  if (!allowTestDataReset) {
    res.status(403).json({
      status: 'error',
      message: 'Bulk TODO cleanup is disabled. Set ALLOW_TEST_DATA_RESET=true only in safe environments.',
    });
    return;
  }

  return todoController.clearAllTodos(req, res, next);
});

export default router;
