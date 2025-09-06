const { sql } = require('@vercel/postgres');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class TodoService {
  constructor() {
    this.initialized = false;
  }

  async init() {
    try {
      // Create table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS todos (
          uuid UUID PRIMARY KEY,
          text VARCHAR(255) NOT NULL,
          completed BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async getAllTodos() {
    if (!this.initialized) {
      await this.init();
    }
    
    try {
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
    } catch (error) {
      console.error('Failed to get todos:', error);
      throw error;
    }
  }

  async getTodoByUuid(uuid) {
    if (!this.initialized) {
      await this.init();
    }
    
    try {
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
    } catch (error) {
      console.error('Failed to get todo by UUID:', error);
      throw error;
    }
  }

  async createTodo(todoData) {
    if (!this.initialized) {
      await this.init();
    }
    
    const newUuid = uuidv4();
    const text = todoData.text.trim();
    const now = new Date().toISOString();
    
    try {
      await sql`
        INSERT INTO todos (uuid, text, completed, created_at, updated_at)
        VALUES (${newUuid}, ${text}, false, ${now}, ${now})
      `;
      
      return {
        uuid: newUuid,
        text: text,
        completed: false,
        createdAt: now,
        updatedAt: now
      };
    } catch (error) {
      console.error('Failed to create todo:', error);
      throw error;
    }
  }

  async updateTodo(uuid, updateData) {
    if (!this.initialized) {
      await this.init();
    }
    
    try {
      // First, check if todo exists
      const existing = await this.getTodoByUuid(uuid);
      if (!existing) {
        return null;
      }
      
      const updatedAt = new Date().toISOString();
      let text = existing.text;
      let completed = existing.completed;
      
      // Update only provided fields
      if (updateData.text !== undefined) {
        text = updateData.text.trim();
      }
      if (updateData.completed !== undefined) {
        completed = Boolean(updateData.completed);
      }
      
      await sql`
        UPDATE todos 
        SET text = ${text}, completed = ${completed}, updated_at = ${updatedAt}
        WHERE uuid = ${uuid}
      `;
      
      return {
        uuid: uuid,
        text: text,
        completed: completed,
        createdAt: existing.createdAt,
        updatedAt: updatedAt
      };
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw error;
    }
  }

  async deleteTodo(uuid) {
    if (!this.initialized) {
      await this.init();
    }
    
    try {
      const { rowCount } = await sql`
        DELETE FROM todos WHERE uuid = ${uuid}
      `;
      
      return rowCount > 0;
    } catch (error) {
      console.error('Failed to delete todo:', error);
      throw error;
    }
  }

  async clearAllTodos() {
    if (!this.initialized) {
      await this.init();
    }
    
    try {
      await sql`DELETE FROM todos`;
    } catch (error) {
      console.error('Failed to clear todos:', error);
      throw error;
    }
  }
}

module.exports = new TodoService();
