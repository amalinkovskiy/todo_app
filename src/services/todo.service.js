const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class TodoService {
  constructor() {
    this.dbPath = path.resolve(config.dbFile);
    this.data = { todos: [] };
    this.init();
  }

  async init() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      await fs.mkdir(dir, { recursive: true });

      // Try to read existing file
      try {
        const fileContent = await fs.readFile(this.dbPath, 'utf8');
        this.data = JSON.parse(fileContent);
      } catch (error) {
        // File doesn't exist or is invalid, create new one
        await this.write();
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async write() {
    try {
      await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Failed to write to database:', error);
      throw error;
    }
  }

  async read() {
    try {
      const fileContent = await fs.readFile(this.dbPath, 'utf8');
      this.data = JSON.parse(fileContent);
    } catch (error) {
      // If file doesn't exist, keep current data
      console.warn('Could not read database file, using current data');
    }
  }

  async getAllTodos() {
    await this.read();
    return this.data.todos.map(({ uuid, ...todo }) => ({
      ...todo,
      uuid, // Now we include UUID in the response
    }));
  }

  async getTodoByUuid(uuid) {
    await this.read();
    return this.data.todos.find((todo) => todo.uuid === uuid);
  }

  async createTodo(todoData) {
    const newTodo = {
      uuid: uuidv4(),
      name: todoData.name.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.todos.push(newTodo);
    await this.write();

    return newTodo;
  }

  async updateTodo(uuid, updateData) {
    await this.read();
    const todoIndex = this.data.todos.findIndex((t) => t.uuid === uuid);

    if (todoIndex === -1) {
      return null;
    }

    const todo = this.data.todos[todoIndex];

    // Update only provided fields
    if (updateData.name !== undefined) {
      todo.name = updateData.name.trim();
    }
    if (updateData.completed !== undefined) {
      todo.completed = Boolean(updateData.completed);
    }

    todo.updatedAt = new Date().toISOString();

    await this.write();
    return todo;
  }

  async deleteTodo(uuid) {
    await this.read();
    const todoIndex = this.data.todos.findIndex((t) => t.uuid === uuid);

    if (todoIndex === -1) {
      return false;
    }

    this.data.todos.splice(todoIndex, 1);
    await this.write();
    return true;
  }
}

module.exports = new TodoService();
