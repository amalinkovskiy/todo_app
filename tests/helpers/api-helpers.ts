/**
 * API утилиты для переиспользования в тестах
 * Позволяют подготавливать данные для UI тестов через API
 */

import { APIRequestContext } from '@playwright/test';

interface Todo {
  uuid: string;
  text: string;
  completed: boolean;
  created_at: string;
}

interface TodoCreateData {
  text: string;
}

interface TodoUpdateData {
  text?: string;
  completed?: boolean;
}

export class TodoApiHelper {
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Создает новую задачу через API
   */
  async createTodo(text: string, completed: boolean = false): Promise<Todo> {
    const response = await this.request.post('/api/todos', {
      data: { text } as TodoCreateData
    });
    
    if (response.status() !== 201) {
      throw new Error(`Failed to create todo: ${response.status()}`);
    }
    
    const todo = await response.json() as Todo;
    
    // Если нужно сразу пометить как выполненную
    if (completed) {
      return await this.updateTodo(todo.uuid, { completed: true });
    }
    
    return todo;
  }

  /**
   * Получает все задачи
   */
  async getAllTodos(): Promise<Todo[]> {
    const response = await this.request.get('/api/todos');
    
    if (response.status() !== 200) {
      throw new Error(`Failed to get todos: ${response.status()}`);
    }
    
    return await response.json() as Todo[];
  }

  /**
   * Получает задачу по UUID
   */
  async getTodoByUuid(uuid: string): Promise<Todo | null> {
    const response = await this.request.get(`/api/todos/${uuid}`);
    
    if (response.status() === 404) {
      return null;
    }
    
    if (response.status() !== 200) {
      throw new Error(`Failed to get todo: ${response.status()}`);
    }
    
    return await response.json() as Todo;
  }

  /**
   * Обновляет задачу
   */
  async updateTodo(uuid: string, data: TodoUpdateData): Promise<Todo> {
    const response = await this.request.patch(`/api/todos/${uuid}`, {
      data
    });
    
    if (response.status() !== 200) {
      throw new Error(`Failed to update todo: ${response.status()}`);
    }
    
    return await response.json() as Todo;
  }

  /**
   * Удаляет задачу
   */
  async deleteTodo(uuid: string): Promise<boolean> {
    const response = await this.request.delete(`/api/todos/${uuid}`);
    if (![200, 204, 404].includes(response.status())) {
      throw new Error(`Failed to delete todo: ${response.status()}`);
    }
    return response.status() !== 404;
  }

  /**
   * Создает несколько тестовых задач для UI тестов
   */
  async createTestTodos(count: number = 3): Promise<Todo[]> {
    const todos: Todo[] = [];
    
    for (let i = 1; i <= count; i++) {
      const todo = await this.createTodo(`Тестовая задача ${i}`);
      todos.push(todo);
    }
    
    return todos;
  }

  /**
   * Создает задачи с разными статусами
   */
  async createMixedStatusTodos(): Promise<Todo[]> {
    const todos: Todo[] = [];
    
    // Обычная задача
    todos.push(await this.createTodo('Не выполненная задача'));
    
    // Выполненная задача
    todos.push(await this.createTodo('Выполненная задача', true));
    
    // Задача с длинным текстом
    todos.push(await this.createTodo('Задача с очень длинным текстом для проверки отображения в UI'));
    
    return todos;
  }

  /**
   * Очищает все задачи через API
   */
  async clearAllTodos(): Promise<boolean> {
    try {
      const response = await this.request.delete('/api/todos');
      return response.status() === 200;
    } catch (error) {
      console.warn('Failed to clear todos:', error);
      return false;
    }
  }
}