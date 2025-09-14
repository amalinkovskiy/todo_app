"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const todo_controller_1 = __importDefault(require("../controllers/todo.controller"));
const router = express_1.default.Router();
// Роуты только для тестовой среды
if (process.env.NODE_ENV === 'test') {
    // DELETE all todos
    router.delete('/clear', todo_controller_1.default.clearAllTodos);
    // GET test status
    router.get('/status', (req, res) => {
        res.json({ status: 'test environment active' });
    });
}
exports.default = router;
//# sourceMappingURL=test.routes.js.map