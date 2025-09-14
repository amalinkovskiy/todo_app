import { Request, Response, NextFunction } from 'express';
import { CreateTodoDto, UpdateTodoDto, TodoParams } from '../validators/todo.validator';
interface TypedRequest<T = any> extends Request {
    body: T;
}
interface TypedParamsRequest<P = any> extends Omit<Request, 'params'> {
    params: P;
}
declare class TodoController {
    getAllTodos(req: Request, res: Response, next: NextFunction): Promise<void>;
    getTodoByUuid(req: TypedParamsRequest<TodoParams>, res: Response, next: NextFunction): Promise<void>;
    createTodo(req: TypedRequest<CreateTodoDto>, res: Response, next: NextFunction): Promise<void>;
    updateTodo(req: TypedParamsRequest<TodoParams> & TypedRequest<UpdateTodoDto>, res: Response, next: NextFunction): Promise<void>;
    deleteTodo(req: TypedParamsRequest<TodoParams>, res: Response, next: NextFunction): Promise<void>;
    clearAllTodos(req: Request, res: Response, next: NextFunction): Promise<void>;
    healthCheck(req: Request, res: Response, next: NextFunction): Promise<void>;
}
declare const _default: TodoController;
export default _default;
//# sourceMappingURL=todo.controller.d.ts.map