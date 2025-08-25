/**
 * API утилиты для переиспользования в тестах
 * Позволяют подготавливать данные для UI тестов через API
 */

export class TodoApiHelper {
  constructor(request) {
    this.request = request;
  }

  /**
   * Создает новую задачу через API
   */
  async createTodo(text, completed = false) {
    const response = await this.request.post('/api/todos', {
      data: { text }
    });
    
    if (response.status() !== 201) {
      throw new Error(`Failed to create todo: ${response.status()}`);
    }
    
    const todo = await response.json();
    
    // Если нужно сразу пометить как выполненную
    if (completed) {
      return await this.updateTodo(todo.uuid, { completed: true });
    }
    
    return todo;
  }

  /**
   * Получает все задачи
   */
  async getAllTodos() {
    const response = await this.request.get('/api/todos');
    
    if (response.status() !== 200) {
      throw new Error(`Failed to get todos: ${response.status()}`);
    }
    
    return await response.json();
  }

  /**
   * Получает задачу по UUID
   */
  async getTodoByUuid(uuid) {
    const response = await this.request.get(`/api/todos/${uuid}`);
    
    if (response.status() === 404) {
      return null;
    }
    
    if (response.status() !== 200) {
      throw new Error(`Failed to get todo: ${response.status()}`);
    }
    
    return await response.json();
  }

  /**
   * Обновляет задачу
   */
  async updateTodo(uuid, data) {
    const response = await this.request.patch(`/api/todos/${uuid}`, {
      data
    });
    
    if (response.status() !== 200) {
      throw new Error(`Failed to update todo: ${response.status()}`);
    }
    
    return await response.json();
  }

  /**
   * Удаляет задачу
   */
  async deleteTodo(uuid) {
    const response = await this.request.delete(`/api/todos/${uuid}`);
    
    if (response.status() !== 204) {
      throw new Error(`Failed to delete todo: ${response.status()}`);
    }
    
    return true;
  }

  /**
   * Создает несколько тестовых задач для UI тестов
   */
  async createTestTodos(count = 3) {
    const todos = [];
    
    for (let i = 1; i <= count; i++) {
      const todo = await this.createTodo(`Тестовая задача ${i}`);
      todos.push(todo);
    }
    
    return todos;
  }

  /**
   * Создает задачи с разными статусами
   */
  async createMixedStatusTodos() {
    const todos = [];
    
    // Обычная задача
    todos.push(await this.createTodo('Не выполненная задача'));
    
    // Выполненная задача
    todos.push(await this.createTodo('Выполненная задача', true));
    
    // Задача с длинным текстом
    todos.push(await this.createTodo('Задача с очень длинным текстом для проверки отображения в UI'));
    
    return todos;
  }

  /**
   * Очищает все задачи через тестовый эндпоинт
   */
  async clearAllTodos() {
    const response = await this.request.delete('/api/test/clear');
    
    if (response.status() !== 204) {
      throw new Error(`Failed to clear todos: ${response.status()}`);
    }
    
    return true;
  }
}
