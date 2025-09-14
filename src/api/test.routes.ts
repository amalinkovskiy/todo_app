import express, { Request, Response } from 'express';
import todoController from '../controllers/todo.controller';

const router = express.Router();

// Роуты только для тестовой среды
if (process.env.NODE_ENV === 'test') {
  // DELETE all todos
  router.delete('/clear', todoController.clearAllTodos);
  
  // GET test status
  router.get('/status', (req: Request, res: Response) => {
    res.json({ status: 'test environment active' });
  });
}

export default router;