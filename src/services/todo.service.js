const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

class TodoService {
  constructor() {
    this.initialized = false;
    this.pool = null;
  }

  async init() {
    if (this.initialized) return;

    const useFileDb = !process.env.POSTGRES_URL || process.env.NODE_ENV === 'test';
    if (useFileDb) {
      // File-based fallback using lowdb
      const dataDir = path.resolve(__dirname, '..', '..', 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const file = path.join(dataDir, 'todos.json');
      this.adapter = new JSONFile(file);
      this.db = new Low(this.adapter, { todos: [] });
      await this.db.read();
      this.db.data ||= { todos: [] };
      this.fileMode = true;
      this.initialized = true;
      console.log('Using lowdb JSON file storage (fallback mode)');
      return;
    }

    // Postgres mode
    this.pool = new Pool({ connectionString: process.env.POSTGRES_URL });
    try {
      const client = await this.pool.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS todos (
          uuid UUID PRIMARY KEY,
          text VARCHAR(255) NOT NULL,
          completed BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      client.release();
      this.initialized = true;
      console.log('Database initialized (single pg Pool)');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async getAllTodos() {
    await this.init();
    
    if (this.fileMode) {
      return this.db.data.todos
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT uuid, text, completed, created_at, updated_at 
        FROM todos 
        ORDER BY created_at DESC
      `);
      client.release();
      return result.rows.map(row => ({
        uuid: row.uuid,
        text: row.text,
        completed: row.completed,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Failed to get todos:', error);
      throw error;
    }
  }

  async getTodoByUuid(uuid) {
    await this.init();
    
    if (this.fileMode) {
      const todo = this.db.data.todos.find(t => t.uuid === uuid);
      return todo || null;
    }
    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT uuid, text, completed, created_at, updated_at 
        FROM todos 
        WHERE uuid = $1
      `, [uuid]);
      client.release();
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return { uuid: row.uuid, text: row.text, completed: row.completed, createdAt: row.created_at, updatedAt: row.updated_at };
    } catch (error) {
      console.error('Failed to get todo by UUID:', error);
      throw error;
    }
  }

  async createTodo(todoData) {
    await this.init();
    
    const newUuid = uuidv4();
    const text = todoData.text.trim();
    
    if (this.fileMode) {
      const now = new Date().toISOString();
      const todo = { uuid: newUuid, text, completed: false, createdAt: now, updatedAt: now };
      this.db.data.todos.push(todo);
      await this.db.write();
      return todo;
    }
    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        INSERT INTO todos (uuid, text, completed)
        VALUES ($1, $2, false)
        RETURNING uuid, text, completed, created_at, updated_at
      `, [newUuid, text]);
      client.release();
      const row = result.rows[0];
      return { uuid: row.uuid, text: row.text, completed: row.completed, createdAt: row.created_at, updatedAt: row.updated_at };
    } catch (error) {
      console.error('Failed to create todo:', error);
      throw error;
    }
  }

  async updateTodo(uuid, updateData) {
    await this.init();
    
    const existing = await this.getTodoByUuid(uuid);
    if (!existing) return null;
    const text = updateData.text !== undefined ? updateData.text.trim() : existing.text;
    const completed = updateData.completed !== undefined ? Boolean(updateData.completed) : existing.completed;

    if (this.fileMode) {
      const now = new Date().toISOString();
      Object.assign(existing, { text, completed, updatedAt: now });
      await this.db.write();
      return existing;
    }
    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        UPDATE todos
        SET text = $1, completed = $2, updated_at = NOW()
        WHERE uuid = $3
        RETURNING uuid, text, completed, created_at, updated_at
      `, [text, completed, uuid]);
      client.release();
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return { uuid: row.uuid, text: row.text, completed: row.completed, createdAt: row.created_at, updatedAt: row.updated_at };
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw error;
    }
  }

  async deleteTodo(uuid) {
    await this.init();
    
    if (this.fileMode) {
      const before = this.db.data.todos.length;
      this.db.data.todos = this.db.data.todos.filter(t => t.uuid !== uuid);
      const after = this.db.data.todos.length;
      await this.db.write();
      return after < before;
    }
    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        DELETE FROM todos WHERE uuid = $1
      `, [uuid]);
      client.release();
      return result.rowCount > 0;
    } catch (error) {
      console.error('Failed to delete todo:', error);
      throw error;
    }
  }

  async clearAllTodos() {
    await this.init();
    
    if (this.fileMode) {
      this.db.data.todos = [];
      await this.db.write();
      return;
    }
    try {
      const client = await this.pool.connect();
      await client.query('DELETE FROM todos');
      client.release();
    } catch (error) {
      console.error('Failed to clear todos:', error);
      throw error;
    }
  }
  async healthCheck() {
    if (this.fileMode) {
      if (!this.initialized) await this.init();
      return { ok: true, db: true, storage: 'file' };
    }
    try {
      if (!this.initialized) await this.init();
      const client = await this.pool.connect();
      const result = await client.query('SELECT 1 as ok');
      client.release();
      return { ok: true, db: result.rows[0].ok === 1, storage: 'postgres' };
    } catch (error) {
      return { ok: false, db: false, error: error.message };
    }
  }
}

module.exports = new TodoService();
