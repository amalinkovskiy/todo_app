const todoService = require('../services/todo.service');

class TodoController {
  async getAllTodos(req, res, next) {
    try {
      const todos = await todoService.getAllTodos();
      res.json(todos);
    } catch (error) {
      next(error);
    }
  }

  async getTodoByUuid(req, res, next) {
    try {
      const { uuid } = req.params;
      const todo = await todoService.getTodoByUuid(uuid);

      if (!todo) {
        return res.status(404).json({
          status: 'error',
          message: 'Todo not found',
        });
      }

      res.json(todo);
    } catch (error) {
      next(error);
    }
  }

  async createTodo(req, res, next) {
    try {
      // Валидация уже произошла в middleware, данные очищены
      const { text } = req.body;
      const newTodo = await todoService.createTodo({ text });
      res.status(201).json(newTodo);
    } catch (error) {
      next(error);
    }
  }

  async updateTodo(req, res, next) {
    try {
      // Валидация уже произошла в middleware, данные очищены
      const { uuid } = req.params;
      const { text, completed } = req.body;

      const updatedTodo = await todoService.updateTodo(uuid, {
        text,
        completed,
      });

      if (!updatedTodo) {
        return res.status(404).json({
          status: 'error',
          message: 'Todo not found',
        });
      }

      res.json(updatedTodo);
    } catch (error) {
      next(error);
    }
  }

  async deleteTodo(req, res, next) {
    try {
      const { uuid } = req.params;
      const deleted = await todoService.deleteTodo(uuid);

      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: 'Todo not found',
        });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TodoController();
