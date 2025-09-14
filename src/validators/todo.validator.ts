import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Схема для создания новой задачи
export const createTodoSchema = z.object({
  text: z.string()
    .trim()
    .min(1, 'Текст задачи не может быть пустым')
    .max(500, 'Текст задачи не может превышать 500 символов')
});

// Схема для обновления задачи
export const updateTodoSchema = z.object({
  text: z.string()
    .trim()
    .min(1, 'Текст задачи не может быть пустым')
    .max(500, 'Текст задачи не может превышать 500 символов')
    .optional(),
  completed: z.boolean().optional()
}).refine(
  (data) => data.text !== undefined || data.completed !== undefined,
  {
    message: 'Необходимо указать хотя бы одно поле для обновления',
    path: ['update']
  }
);

// Схема для UUID параметров
export const uuidSchema = z.string().uuid('Некорректный формат UUID');

// Параметры маршрута с UUID
export const todoParamsSchema = z.object({
  uuid: uuidSchema
});

// Inferred TypeScript types from Zod schemas
export type CreateTodoDto = z.infer<typeof createTodoSchema>;
export type UpdateTodoDto = z.infer<typeof updateTodoSchema>;
export type TodoParams = z.infer<typeof todoParamsSchema>;

// Validation middleware factory
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        res.status(400).json({
          status: 'error',
          message: 'Ошибка валидации',
          error: 'Validation failed',
          errors
        });
        return;
      }
      
      req.body = result.data;
      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Внутренняя ошибка сервера при валидации'
      });
    }
  };
}

// Validation middleware for request parameters
export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        res.status(400).json({
          status: 'error',
          message: 'Ошибка валидации параметров',
          error: 'Parameter validation failed',
          errors
        });
        return;
      }
      
      req.params = result.data as any;
      next();
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Внутренняя ошибка сервера при валидации параметров'
      });
    }
  };
}

// Export individual validators for convenience
export const validateCreateTodo = validateBody(createTodoSchema);
export const validateUpdateTodo = validateBody(updateTodoSchema);
export const validateTodoParams = validateParams(todoParamsSchema);