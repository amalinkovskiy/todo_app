import { CreateTodoDto, UpdateTodoDto } from '../validators/todo.validator';
export interface Todo {
    uuid: string;
    text: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}
interface HealthCheckResult {
    db: boolean;
    storage: 'postgres' | 'file' | 'memory';
    fallbackActivated: boolean;
    lastError?: string | undefined;
}
declare class TodoService {
    private initialized;
    private pool;
    private fileMode;
    private memoryMode;
    private lastDbError;
    private fallbackActivated;
    private dataFile?;
    private memory?;
    init(): Promise<void>;
    getAllTodos(): Promise<Todo[]>;
    getTodoByUuid(uuid: string): Promise<Todo | null>;
    createTodo(todoData: CreateTodoDto): Promise<Todo>;
    updateTodo(uuid: string, updateData: UpdateTodoDto): Promise<Todo | null>;
    deleteTodo(uuid: string): Promise<boolean>;
    clearAllTodos(): Promise<void>;
    healthCheck(): Promise<HealthCheckResult>;
    private mapRowToTodo;
}
declare const _default: TodoService;
export default _default;
//# sourceMappingURL=todo.service.d.ts.map