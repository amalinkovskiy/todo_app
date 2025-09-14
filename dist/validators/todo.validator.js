"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTodoParams = exports.validateUpdateTodo = exports.validateCreateTodo = exports.todoParamsSchema = exports.uuidSchema = exports.updateTodoSchema = exports.createTodoSchema = void 0;
exports.validateBody = validateBody;
exports.validateParams = validateParams;
const zod_1 = require("zod");
// Схема для создания новой задачи
exports.createTodoSchema = zod_1.z.object({
    text: zod_1.z.string()
        .trim()
        .min(1, 'Текст задачи не может быть пустым')
        .max(500, 'Текст задачи не может превышать 500 символов')
});
// Схема для обновления задачи
exports.updateTodoSchema = zod_1.z.object({
    text: zod_1.z.string()
        .trim()
        .min(1, 'Текст задачи не может быть пустым')
        .max(500, 'Текст задачи не может превышать 500 символов')
        .optional(),
    completed: zod_1.z.boolean().optional()
}).refine((data) => data.text !== undefined || data.completed !== undefined, {
    message: 'Необходимо указать хотя бы одно поле для обновления',
    path: ['update']
});
// Схема для UUID параметров
exports.uuidSchema = zod_1.z.string().uuid('Некорректный формат UUID');
// Параметры маршрута с UUID
exports.todoParamsSchema = zod_1.z.object({
    uuid: exports.uuidSchema
});
// Validation middleware factory
function validateBody(schema) {
    return (req, res, next) => {
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
        }
        catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Внутренняя ошибка сервера при валидации'
            });
        }
    };
}
// Validation middleware for request parameters
function validateParams(schema) {
    return (req, res, next) => {
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
            req.params = result.data;
            next();
        }
        catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Внутренняя ошибка сервера при валидации параметров'
            });
        }
    };
}
// Export individual validators for convenience
exports.validateCreateTodo = validateBody(exports.createTodoSchema);
exports.validateUpdateTodo = validateBody(exports.updateTodoSchema);
exports.validateTodoParams = validateParams(exports.todoParamsSchema);
//# sourceMappingURL=todo.validator.js.map