"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const uuid_1 = require("uuid");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
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
        if (this.initialized)
            return;
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
            console.warn('[storage] Using in-memory storage fallback (serverless environment without database URL)');
            return;
        }
        if (useFileDb) {
            // Simple JSON file fallback (no lowdb dependency for serverless compatibility)
            const dataDir = path.resolve(__dirname, '..', '..', 'data');
            if (!fs.existsSync(dataDir))
                fs.mkdirSync(dataDir, { recursive: true });
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
        try {
            // On some managed platforms SSL is required; allow opt-out via DISABLE_DB_SSL
            const ssl = process.env.DISABLE_DB_SSL !== 'true' ? { rejectUnauthorized: false } : false;
            this.pool = new pg_1.Pool({
                connectionString,
                ssl,
                // Serverless-friendly pool settings
                max: 3, // Limit concurrent connections for serverless
                connectionTimeoutMillis: 10000, // 10 second timeout
                idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
            });
            // Test connection
            const client = await this.pool.connect();
            client.release();
            this.initialized = true;
            console.log('[storage] PostgreSQL connection established successfully');
        }
        catch (error) {
            this.lastDbError = error instanceof Error ? error.message : String(error);
            console.error('[storage] PostgreSQL connection failed:', this.lastDbError);
            // Graceful fallback to in-memory if allowed
            if (process.env.ALLOW_MEMORY_FALLBACK !== 'false') {
                this.memory = { todos: [] };
                this.memoryMode = true;
                this.fallbackActivated = true;
                this.initialized = true;
            }
        }
    }
    async getAllTodos() {
        await this.init();
        if (this.fileMode && this.dataFile) {
            const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
            return (data.todos || [])
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (this.memoryMode && this.memory) {
            return this.memory.todos
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        try {
            const client = await this.pool.connect();
            const result = await client.query(`
        SELECT uuid, text, completed, created_at, updated_at 
        FROM todos 
        ORDER BY created_at DESC
      `);
            client.release();
            return result.rows.map(this.mapRowToTodo);
        }
        catch (error) {
            console.error('Failed to get todos:', error);
            throw error;
        }
    }
    async getTodoByUuid(uuid) {
        await this.init();
        if (this.fileMode && this.dataFile) {
            const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
            const todo = (data.todos || []).find(t => t.uuid === uuid);
            return todo || null;
        }
        if (this.memoryMode && this.memory) {
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
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            if (!row)
                return null;
            return this.mapRowToTodo(row);
        }
        catch (error) {
            console.error('Failed to get todo by UUID:', error);
            throw error;
        }
    }
    async createTodo(todoData) {
        await this.init();
        const newUuid = (0, uuid_1.v4)();
        const text = todoData.text.trim();
        if (this.fileMode && this.dataFile) {
            const now = new Date().toISOString();
            const todo = { uuid: newUuid, text, completed: false, createdAt: now, updatedAt: now };
            const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
            data.todos = data.todos || [];
            data.todos.push(todo);
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            return todo;
        }
        if (this.memoryMode && this.memory) {
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
            if (!row)
                throw new Error('Failed to create todo - no row returned');
            return this.mapRowToTodo(row);
        }
        catch (error) {
            console.error('Failed to create todo:', error);
            throw error;
        }
    }
    async updateTodo(uuid, updateData) {
        await this.init();
        const existing = await this.getTodoByUuid(uuid);
        if (!existing)
            return null;
        const text = updateData.text !== undefined ? updateData.text.trim() : existing.text;
        const completed = updateData.completed !== undefined ? Boolean(updateData.completed) : existing.completed;
        if (this.fileMode && this.dataFile) {
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
        if (this.memoryMode && this.memory) {
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
            if (result.rows.length === 0)
                return null;
            const row = result.rows[0];
            if (!row)
                return null;
            return this.mapRowToTodo(row);
        }
        catch (error) {
            console.error('Failed to update todo:', error);
            throw error;
        }
    }
    async deleteTodo(uuid) {
        await this.init();
        if (this.fileMode && this.dataFile) {
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
        if (this.memoryMode && this.memory) {
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
            return result.rowCount !== null && result.rowCount > 0;
        }
        catch (error) {
            console.error('Failed to delete todo:', error);
            throw error;
        }
    }
    async clearAllTodos() {
        await this.init();
        if (this.fileMode && this.dataFile) {
            const data = { todos: [] };
            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            return;
        }
        if (this.memoryMode && this.memory) {
            this.memory.todos = [];
            return;
        }
        try {
            const client = await this.pool.connect();
            await client.query('DELETE FROM todos');
            client.release();
        }
        catch (error) {
            console.error('Failed to clear all todos:', error);
            throw error;
        }
    }
    async healthCheck() {
        await this.init();
        if (this.memoryMode) {
            return {
                db: false,
                storage: 'memory',
                fallbackActivated: this.fallbackActivated,
                lastError: this.lastDbError || undefined
            };
        }
        if (this.fileMode) {
            return {
                db: false,
                storage: 'file',
                fallbackActivated: this.fallbackActivated
            };
        }
        try {
            const client = await this.pool.connect();
            await client.query('SELECT 1');
            client.release();
            return {
                db: true,
                storage: 'postgres',
                fallbackActivated: false
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                db: false,
                storage: 'postgres',
                fallbackActivated: this.fallbackActivated,
                lastError: errorMessage
            };
        }
    }
    mapRowToTodo(row) {
        return {
            uuid: row.uuid,
            text: row.text,
            completed: row.completed,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString()
        };
    }
}
exports.default = new TodoService();
//# sourceMappingURL=todo.service.js.map