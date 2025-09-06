const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class TodoService {
  constructor() {
    this.dbPath = null;
    this.data = { todos: [] };
    this.initialized = false;
  }

  async init() {
    // Recalculate dbPath each time to pick up environment changes
    const config = require('../config');
    // Vercel has a read-only filesystem, except for /tmp.
    // In production, we'll use the /tmp directory for our database file.
    if (config.nodeEnv === 'production') {
      this.dbPath = path.join('/tmp', path.basename(config.dbFile));
    } else {
      this.dbPath = path.resolve(config.dbFile);
    }
    
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
      
      this.initialized = true;
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
    if (!this.initialized) {
      await this.init();
    }
    try {
      const fileContent = await fs.readFile(this.dbPath, 'utf8');
      this.data = JSON.parse(fileContent);
    } catch (error) {
      // If file doesn't exist, keep current data
      console.warn('Could not read database file, using current data');
    }
  }

  async getAllTodos() {
    if (!this.initialized) {
      await this.init();
    }
    await this.read();
    return this.data.todos.map(({ uuid, ...todo }) => ({
      ...todo,
      uuid, // Now we include UUID in the response
    }));
  }

  async getTodoByUuid(uuid) {
    if (!this.initialized) {
      await this.init();
    }
    await this.read();
    return this.data.todos.find((todo) => todo.uuid === uuid);
  }

  async createTodo(todoData) {
    if (!this.initialized) {
      await this.init();
    }
    const newTodo = {
      uuid: uuidv4(),
      text: todoData.text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.todos.push(newTodo);
    await this.write();

    return newTodo;
  }

  async updateTodo(uuid, updateData) {
    if (!this.initialized) {
      await this.init();
    }
    await this.read();
    const todoIndex = this.data.todos.findIndex((t) => t.uuid === uuid);

    if (todoIndex === -1) {
      return null;
    }

    const todo = this.data.todos[todoIndex];

    // Update only provided fields
    if (updateData.text !== undefined) {
      todo.text = updateData.text.trim();
    }
    if (updateData.completed !== undefined) {
      todo.completed = Boolean(updateData.completed);
    }

    todo.updatedAt = new Date().toISOString();

    await this.write();
    return todo;
  }

  async deleteTodo(uuid) {
    if (!this.initialized) {
      await this.init();
    }
    await this.read();
    const todoIndex = this.data.todos.findIndex((t) => t.uuid === uuid);

    if (todoIndex === -1) {
      return false;
    }

    this.data.todos.splice(todoIndex, 1);
    await this.write();
    return true;
  }

  async clearAllTodos() {
    if (!this.initialized) {
      await this.init();
    }
    this.data.todos = [];
    await this.write();
  }
}

module.exports = new TodoService();
