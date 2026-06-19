import express, { Request, Response, NextFunction } from 'express';
import todoController from '../controllers/todo.controller';

const router = express.Router();

const allowTestDataReset = process.env.ALLOW_TEST_DATA_RESET === 'true';

// Test status endpoint. The parent app mounts this router only when ENABLE_TEST_ROUTES=true.
router.get('/status', (req: Request, res: Response) => {
  res.json({
    status: 'test routes active',
    appEnv: process.env.APP_ENV || 'local',
    allowTestDataReset,
  });
});

// Destructive route for stage/test only. Never enable this in production.
router.delete('/clear', (req: Request, res: Response, next: NextFunction) => {
  if (!allowTestDataReset) {
    res.status(403).json({
      status: 'error',
      message: 'Test data reset is disabled. Set ALLOW_TEST_DATA_RESET=true only in safe environments.',
    });
    return;
  }

  return todoController.clearAllTodos(req, res, next);
});

export default router;
