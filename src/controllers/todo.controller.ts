import { Request, Response, NextFunction } from 'express';
import todoService from '../services/todo.service';
import { CreateTodoDto, UpdateTodoDto, TodoParams } from '../validators/todo.validator';

// Extend Express Request to include validated data
interface TypedRequest<T = any> extends Request {
  body: T;
}

interface TypedParamsRequest<P = any> extends Omit<Request, 'params'> {
  params: P;
}

class TodoController {
  async getAllTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const todos = await todoService.getAllTodos();
      res.json(todos);
    } catch (error) {
      next(error);
    }
  }

  async getTodoByUuid(req: TypedParamsRequest<TodoParams>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uuid } = req.params;
      const todo = await todoService.getTodoByUuid(uuid);

      if (!todo) {
        res.status(404).json({
          status: 'error',
          message: 'Todo not found',
        });
        return;
      }

      res.json(todo);
    } catch (error) {
      next(error);
    }
  }

  async createTodo(req: TypedRequest<CreateTodoDto>, res: Response, next: NextFunction): Promise<void> {
    try {
      const todo = await todoService.createTodo(req.body);
      res.status(201).json(todo);
    } catch (error) {
      next(error);
    }
  }

  async updateTodo(req: TypedParamsRequest<TodoParams> & TypedRequest<UpdateTodoDto>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uuid } = req.params;
      const updatedTodo = await todoService.updateTodo(uuid, req.body);

      if (!updatedTodo) {
        res.status(404).json({
          status: 'error',
          message: 'Todo not found',
        });
        return;
      }

      res.json(updatedTodo);
    } catch (error) {
      next(error);
    }
  }

  async deleteTodo(req: TypedParamsRequest<TodoParams>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uuid } = req.params;
      const deleted = await todoService.deleteTodo(uuid);

      if (!deleted) {
        res.status(404).json({
          status: 'error',
          message: 'Todo not found',
        });
        return;
      }

      // Return 204 No Content for successful deletion
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async clearAllTodos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await todoService.clearAllTodos();
      res.json({ 
        status: 'success',
        message: 'All todos cleared successfully' 
      });
    } catch (error) {
      next(error);
    }
  }

  async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await todoService.healthCheck();
      const status = health.db ? 'ok' : 'degraded';
      
      res.status(health.db ? 200 : 503).json({
        status,
        ...health,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TodoController();