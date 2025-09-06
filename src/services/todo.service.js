const { sql } = require('@vercel/postgres');
const { v4: uuidv4 } = require('uuid');

class TodoService {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    try {
      // Create table if it doesn't exist
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
      console.log('Database initialized successfully using PostgreSQL');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async getAllTodos() {
    await this.init();
    
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
    await this.init();
    
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
    await this.init();
    
    const newUuid = uuidv4();
    const text = todoData.text.trim();
    
    try {
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
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw error;
    }
  }

  async deleteTodo(uuid) {
    await this.init();
    
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
    await this.init();
    
    try {
      await sql`DELETE FROM todos`;
    } catch (error) {
      console.error('Failed to clear todos:', error);
      throw error;
    }
  }
}

module.exports = new TodoService();
