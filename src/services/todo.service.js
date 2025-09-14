const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

class TodoService {
  constructor() {
    this.initialized = false;
    this.pool = null;
    this.fileMode = false;
    this.memoryMode = false;
    this.lastDbError = null;
    this.fallbackActivated = false;
  }

  async init() {
    if (this.initialized) return;

  const isServerless = !!process.env.VERCEL; // Vercel sets this env variable
  // Support both POSTGRES_URL and DATABASE_URL (common on hosts)
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  const noPostgres = !connectionString;
  const useMemoryDb = isServerless && noPostgres; // serverless + no DB URL => in-memory only
  const useFileDb = !useMemoryDb && (noPostgres || process.env.NODE_ENV === 'test');

    if (useMemoryDb) {
      // Pure in-memory store (safe for serverless, non-persistent)
      this.memory = { todos: [] };
      this.memoryMode = true;
      this.initialized = true;
      console.warn('[storage] Using in-memory storage (serverless fallback) – no DATABASE_URL/POSTGRES_URL set');
      return;
    }

    if (useFileDb) {
      // Simple JSON file fallback (no lowdb dependency for serverless compatibility)
      const dataDir = path.resolve(__dirname, '..', '..', 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      this.dataFile = path.join(dataDir, 'todos.json');
      
      // Initialize empty file if doesn't exist
      if (!fs.existsSync(this.dataFile)) {
        fs.writeFileSync(this.dataFile, JSON.stringify({ todos: [] }));
      }
      
      this.fileMode = true;
      this.initialized = true;
      console.warn('[storage] Using simple JSON file storage fallback (no database URL provided)');
      return;
    }

    // Postgres mode
    // On some managed platforms SSL is required; allow opt-out via DISABLE_DB_SSL
    const sslRequired = isServerless && !process.env.DISABLE_DB_SSL;
    this.pool = new Pool({
      connectionString,
      ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || '5000', 10),
      idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000', 10),
      max: parseInt(process.env.PG_POOL_MAX || '5', 10)
    });
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
      console.log(`[storage] Database initialized (${sslRequired ? 'ssl' : 'plain'} connection)`);
    } catch (error) {
      this.lastDbError = error.message;
      const requireDb = process.env.REQUIRE_DATABASE === '1';
      if (requireDb) {
        console.error('Failed to initialize database (REQUIRE_DATABASE=1):', error);
        throw error; // hard fail
      }
      // Graceful fallback to in-memory if allowed
      console.warn('[storage] Database init failed, falling back to in-memory storage:', error.message);
      this.memory = { todos: [] };
      this.memoryMode = true;
      this.fallbackActivated = true;
      this.initialized = true;
    }
  }

  async getAllTodos() {
    await this.init();
    
    if (this.fileMode) {
      const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      return (data.todos || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (this.memoryMode) {
      return this.memory.todos
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
      const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      const todo = (data.todos || []).find(t => t.uuid === uuid);
      return todo || null;
    }
    if (this.memoryMode) {
      const todo = this.memory.todos.find(t => t.uuid === uuid);
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
      const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      data.todos = data.todos || [];
      data.todos.push(todo);
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
      return todo;
    }
    if (this.memoryMode) {
      const now = new Date().toISOString();
      const todo = { uuid: newUuid, text, completed: false, createdAt: now, updatedAt: now };
      this.memory.todos.push(todo);
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
      const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      data.todos = data.todos || [];
      const todo = data.todos.find(t => t.uuid === uuid);
      if (todo) {
        Object.assign(todo, { text, completed, updatedAt: now });
        fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
        return todo;
      }
      return null;
    }
    if (this.memoryMode) {
      const now = new Date().toISOString();
      Object.assign(existing, { text, completed, updatedAt: now });
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
      const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      data.todos = data.todos || [];
      const before = data.todos.length;
      data.todos = data.todos.filter(t => t.uuid !== uuid);
      const after = data.todos.length;
      if (after < before) {
        fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
        return true;
      }
      return false;
    }
    if (this.memoryMode) {
      const before = this.memory.todos.length;
      this.memory.todos = this.memory.todos.filter(t => t.uuid !== uuid);
      const after = this.memory.todos.length;
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
      const data = { todos: [] };
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
      return;
    }
    if (this.memoryMode) {
      this.memory.todos = [];
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
    if (!this.initialized) {
      try { await this.init(); } catch (_) { /* init handles fallback */ }
    }
    const base = {
      fallbackActivated: this.fallbackActivated,
      lastDbError: this.lastDbError || null
    };
    if (this.fileMode) {
      return { ok: true, db: true, storage: 'file', ...base };
    }
    if (this.memoryMode) {
      return { ok: true, db: true, storage: 'memory', ...base };
    }
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT 1 as ok');
      client.release();
      return { ok: true, db: result.rows[0].ok === 1, storage: 'postgres', ...base };
    } catch (error) {
      this.lastDbError = error.message;
      return { ok: false, db: false, storage: 'postgres', error: error.message, ...base };
    }
  }
}

module.exports = new TodoService();
