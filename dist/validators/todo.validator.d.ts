import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const createTodoSchema: z.ZodObject<{
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    text: string;
}, {
    text: string;
}>;
export declare const updateTodoSchema: z.ZodEffects<z.ZodObject<{
    text: z.ZodOptional<z.ZodString>;
    completed: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    text?: string | undefined;
    completed?: boolean | undefined;
}, {
    text?: string | undefined;
    completed?: boolean | undefined;
}>, {
    text?: string | undefined;
    completed?: boolean | undefined;
}, {
    text?: string | undefined;
    completed?: boolean | undefined;
}>;
export declare const uuidSchema: z.ZodString;
export declare const todoParamsSchema: z.ZodObject<{
    uuid: z.ZodString;
}, "strip", z.ZodTypeAny, {
    uuid: string;
}, {
    uuid: string;
}>;
export type CreateTodoDto = z.infer<typeof createTodoSchema>;
export type UpdateTodoDto = z.infer<typeof updateTodoSchema>;
export type TodoParams = z.infer<typeof todoParamsSchema>;
export declare function validateBody<T>(schema: z.ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
export declare function validateParams<T>(schema: z.ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
export declare const validateCreateTodo: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateUpdateTodo: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateTodoParams: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=todo.validator.d.ts.map