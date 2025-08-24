const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class TodoService {
  constructor() {
    this.db = null;
    this.init();
  }

  async init() {
    try {
      // Initialize the database with default data
      const adapter = new JSONFile(config.dbFile);
      this.db = new Low(adapter, { todos: [] });
      await this.db.read();
      
      // If file doesn't exist, write default data
      if (this.db.data === null) {
        this.db.data = { todos: [] };
        await this.db.write();
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async getAllTodos() {
    await this.db.read();
    return this.db.data.todos.map(({ uuid, ...todo }) => ({
      ...todo,
      uuid, // Now we include UUID in the response
    }));
  }

  async getTodoByUuid(uuid) {
    await this.db.read();
    return this.db.data.todos.find((todo) => todo.uuid === uuid);
  }

  async createTodo(todoData) {
    const newTodo = {
      uuid: uuidv4(),
      name: todoData.name.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db.data.todos.push(newTodo);
    await this.db.write();

    return newTodo;
  }

  async updateTodo(uuid, updateData) {
    await this.db.read();
    const todoIndex = this.db.data.todos.findIndex((t) => t.uuid === uuid);
    
    if (todoIndex === -1) {
      return null;
    }

    const todo = this.db.data.todos[todoIndex];
    
    // Update only provided fields
    if (updateData.name !== undefined) {
      todo.name = updateData.name.trim();
    }
    if (updateData.completed !== undefined) {
      todo.completed = Boolean(updateData.completed);
    }
    
    todo.updatedAt = new Date().toISOString();
    
    await this.db.write();
    return todo;
  }

  async deleteTodo(uuid) {
    await this.db.read();
    const todoIndex = this.db.data.todos.findIndex((t) => t.uuid === uuid);
    
    if (todoIndex === -1) {
      return false;
    }

    this.db.data.todos.splice(todoIndex, 1);
    await this.db.write();
    return true;
  }
}

module.exports = new TodoService();
