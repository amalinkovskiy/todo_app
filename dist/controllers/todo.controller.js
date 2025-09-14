"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const todo_service_1 = __importDefault(require("../services/todo.service"));
class TodoController {
    async getAllTodos(req, res, next) {
        try {
            const todos = await todo_service_1.default.getAllTodos();
            res.json(todos);
        }
        catch (error) {
            next(error);
        }
    }
    async getTodoByUuid(req, res, next) {
        try {
            const { uuid } = req.params;
            const todo = await todo_service_1.default.getTodoByUuid(uuid);
            if (!todo) {
                res.status(404).json({
                    status: 'error',
                    message: 'Todo not found',
                });
                return;
            }
            res.json(todo);
        }
        catch (error) {
            next(error);
        }
    }
    async createTodo(req, res, next) {
        try {
            const todo = await todo_service_1.default.createTodo(req.body);
            res.status(201).json(todo);
        }
        catch (error) {
            next(error);
        }
    }
    async updateTodo(req, res, next) {
        try {
            const { uuid } = req.params;
            const updatedTodo = await todo_service_1.default.updateTodo(uuid, req.body);
            if (!updatedTodo) {
                res.status(404).json({
                    status: 'error',
                    message: 'Todo not found',
                });
                return;
            }
            res.json(updatedTodo);
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTodo(req, res, next) {
        try {
            const { uuid } = req.params;
            const deleted = await todo_service_1.default.deleteTodo(uuid);
            if (!deleted) {
                res.status(404).json({
                    status: 'error',
                    message: 'Todo not found',
                });
                return;
            }
            // Return 204 No Content for successful deletion
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
    async clearAllTodos(req, res, next) {
        try {
            await todo_service_1.default.clearAllTodos();
            res.json({
                status: 'success',
                message: 'All todos cleared successfully'
            });
        }
        catch (error) {
            next(error);
        }
    }
    async healthCheck(req, res, next) {
        try {
            const health = await todo_service_1.default.healthCheck();
            const status = health.db ? 'ok' : 'degraded';
            res.status(health.db ? 200 : 503).json({
                status,
                ...health,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new TodoController();
//# sourceMappingURL=todo.controller.js.map