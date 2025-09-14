"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const todo_controller_1 = __importDefault(require("../controllers/todo.controller"));
const todo_validator_1 = require("../validators/todo.validator");
const router = express_1.default.Router();
// GET all todos
router.get('/', todo_controller_1.default.getAllTodos);
// GET single todo by uuid
router.get('/:uuid', (0, todo_validator_1.validateParams)(todo_validator_1.todoParamsSchema), todo_controller_1.default.getTodoByUuid);
// POST new todo
router.post('/', (0, todo_validator_1.validateBody)(todo_validator_1.createTodoSchema), todo_controller_1.default.createTodo);
// PUT update todo by uuid (full update)
router.put('/:uuid', (0, todo_validator_1.validateParams)(todo_validator_1.todoParamsSchema), (0, todo_validator_1.validateBody)(todo_validator_1.updateTodoSchema), todo_controller_1.default.updateTodo);
// PATCH update todo by uuid (partial update)
router.patch('/:uuid', (0, todo_validator_1.validateParams)(todo_validator_1.todoParamsSchema), (0, todo_validator_1.validateBody)(todo_validator_1.updateTodoSchema), todo_controller_1.default.updateTodo);
// DELETE todo by uuid
router.delete('/:uuid', (0, todo_validator_1.validateParams)(todo_validator_1.todoParamsSchema), todo_controller_1.default.deleteTodo);
// DELETE all todos (for testing purposes)
router.delete('/', todo_controller_1.default.clearAllTodos);
exports.default = router;
//# sourceMappingURL=todo.routes.js.map