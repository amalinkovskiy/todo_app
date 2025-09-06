const { sql } = require('@vercel/postgres');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class TodoService {
  constructor() {
    this.initialized = false;
    this.useLocalPg = false;
    this.pool = null;
  }

  async init() {
    if (this.initialized) return;
    
    // Check if we should use local PostgreSQL (for tests) or Vercel Postgres (for production)
    const isTest = process.env.NODE_ENV === 'test';
    const hasLocalUrl = process.env.POSTGRES_URL && process.env.POSTGRES_URL.includes('localhost');
    
    if (isTest || hasLocalUrl) {
      // Use standard pg client for local PostgreSQL
      this.useLocalPg = true;
      this.pool = new Pool({
        connectionString: process.env.POSTGRES_URL
      });
      
      try {
        // Test connection and create table
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
        console.log('Database initialized successfully using local PostgreSQL');
      } catch (error) {
        console.error('Failed to initialize local PostgreSQL database:', error);
        throw error;
      }
    } else {
      // Use Vercel Postgres for production
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS todos (
            uuid UUID PRIMARY KEY,
            text VARCHAR(255) NOT NULL,
            completed BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `;
        
        this.initialized = true;
        console.log('Database initialized successfully using Vercel PostgreSQL');
      } catch (error) {
        console.error('Failed to initialize Vercel PostgreSQL database:', error);
        throw error;
      }
    }
  }

  async getAllTodos() {
    await this.init();
    
    try {
      if (this.useLocalPg) {
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
      } else {
        const { rows } = await sql`
          SELECT uuid, text, completed, created_at, updated_at 
          FROM todos 
          ORDER BY created_at DESC
        `;
        
        return rows.map(row => ({
          uuid: row.uuid,
          text: row.text,
          completed: row.completed,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      }
    } catch (error) {
      console.error('Failed to get todos:', error);
      throw error;
    }
  }

  async getTodoByUuid(uuid) {
    await this.init();
    
    try {
      if (this.useLocalPg) {
        const client = await this.pool.connect();
        const result = await client.query(`
          SELECT uuid, text, completed, created_at, updated_at 
          FROM todos 
          WHERE uuid = $1
        `, [uuid]);
        client.release();
        
        if (result.rows.length === 0) {
          return null;
        }
        
        const row = result.rows[0];
        return {
          uuid: row.uuid,
          text: row.text,
          completed: row.completed,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      } else {
        const { rows } = await sql`
          SELECT uuid, text, completed, created_at, updated_at 
          FROM todos 
          WHERE uuid = ${uuid}
        `;
        
        if (rows.length === 0) {
          return null;
        }
        
        const row = rows[0];
        return {
          uuid: row.uuid,
          text: row.text,
          completed: row.completed,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } catch (error) {
      console.error('Failed to get todo by UUID:', error);
      throw error;
    }
  }

  async createTodo(todoData) {
    await this.init();
    
    const newUuid = uuidv4();
    const text = todoData.text.trim();
    
    try {
      if (this.useLocalPg) {
        const client = await this.pool.connect();
        const result = await client.query(`
          INSERT INTO todos (uuid, text, completed)
          VALUES ($1, $2, false)
          RETURNING uuid, text, completed, created_at, updated_at
        `, [newUuid, text]);
        client.release();
        
        const row = result.rows[0];
        return {
          uuid: row.uuid,
          text: row.text,
          completed: row.completed,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      } else {
        const result = await sql`
          INSERT INTO todos (uuid, text, completed)
          VALUES (${newUuid}, ${text}, false)
          RETURNING uuid, text, completed, created_at, updated_at
        `;
        
        const row = result.rows[0];
        return {
          uuid: row.uuid,
          text: row.text,
          completed: row.completed,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } catch (error) {
      console.error('Failed to create todo:', error);
      throw error;
    }
  }

  async updateTodo(uuid, updateData) {
    await this.init();
    
    try {
      const existing = await this.getTodoByUuid(uuid);
      if (!existing) {
        return null;
      }
      
      const text = updateData.text !== undefined ? updateData.text.trim() : existing.text;
      const completed = updateData.completed !== undefined ? Boolean(updateData.completed) : existing.completed;
      
      if (this.useLocalPg) {
        const client = await this.pool.connect();
        const result = await client.query(`
          UPDATE todos 
          SET text = $1, completed = $2, updated_at = NOW()
          WHERE uuid = $3
          RETURNING uuid, text, completed, created_at, updated_at
        `, [text, completed, uuid]);
        client.release();
        
        const row = result.rows[0];
        return {
          uuid: row.uuid,
          text: row.text,
          completed: row.completed,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      } else {
        const result = await sql`
          UPDATE todos 
          SET text = ${text}, completed = ${completed}, updated_at = NOW()
          WHERE uuid = ${uuid}
          RETURNING uuid, text, completed, created_at, updated_at
        `;
        
        const row = result.rows[0];
        return {
          uuid: row.uuid,
          text: row.text,
          completed: row.completed,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw error;
    }
  }

  async deleteTodo(uuid) {
    await this.init();
    
    try {
      if (this.useLocalPg) {
        const client = await this.pool.connect();
        const result = await client.query(`
          DELETE FROM todos WHERE uuid = $1
        `, [uuid]);
        client.release();
        
        return result.rowCount > 0;
      } else {
        const { rowCount } = await sql`
          DELETE FROM todos WHERE uuid = ${uuid}
        `;
        
        return rowCount > 0;
      }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      throw error;
    }
  }

  async clearAllTodos() {
    await this.init();
    
    try {
      if (this.useLocalPg) {
        const client = await this.pool.connect();
        await client.query(`TRUNCATE TABLE todos RESTART IDENTITY`);
        client.release();
      } else {
        await sql`TRUNCATE TABLE todos RESTART IDENTITY`;
      }
    } catch (error) {
      console.error('Failed to clear todos:', error);
      throw error;
    }
  }
}

module.exports = new TodoService();
