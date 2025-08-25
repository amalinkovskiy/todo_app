import { test, expect } from '@playwright/test';

/**
 * API тесты на Playwright
 * Переписанные с Jest/Supertest для единообразного репортинга
 */

test.describe('TODO API Tests', () => {
  let createdTodoUuid;

  test.beforeEach(async ({ request }) => {
    // Очищаем базу данных перед каждым тестом
    await request.delete('/api/test/clear');
  });

  test.describe('POST /api/todos', () => {
    test('should create a new todo', async ({ request }) => {
      const todoData = { text: 'Test todo from Playwright' };

      const response = await request.post('/api/todos', {
        data: todoData
      });

      expect(response.status()).toBe(201);
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('uuid');
      expect(responseBody.text).toBe('Test todo from Playwright');
      expect(responseBody.completed).toBe(false);
      expect(responseBody).toHaveProperty('createdAt');
      expect(responseBody).toHaveProperty('updatedAt');

      createdTodoUuid = responseBody.uuid;
    });

    test('should return 400 for empty text', async ({ request }) => {
      const response = await request.post('/api/todos', {
        data: { text: '' }
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
      expect(responseBody.message).toContain('валидации');
    });

    test('should return 400 for missing text', async ({ request }) => {
      const response = await request.post('/api/todos', {
        data: {}
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
      expect(responseBody.message).toContain('валидации');
    });

    test('should return 400 for text too long', async ({ request }) => {
      const longText = 'A'.repeat(501); // Больше максимума в 500 символов
      
      const response = await request.post('/api/todos', {
        data: { text: longText }
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
      expect(responseBody.message).toContain('валидации');
    });
  });

  test.describe('GET /api/todos', () => {
    test('should return empty array initially', async ({ request }) => {
      const response = await request.get('/api/todos');

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody).toHaveLength(0);
    });

    test('should return todos after creation', async ({ request }) => {
      // Создаем несколько задач
      const todos = [
        { text: 'First todo' },
        { text: 'Second todo' },
        { text: 'Third todo' }
      ];

      for (const todo of todos) {
        await request.post('/api/todos', { data: todo });
      }

      // Получаем все задачи
      const response = await request.get('/api/todos');
      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(Array.isArray(responseBody)).toBe(true);
      expect(responseBody).toHaveLength(3);
      
      // Проверяем, что все задачи присутствуют
      const todoTexts = responseBody.map(todo => todo.text);
      expect(todoTexts).toContain('First todo');
      expect(todoTexts).toContain('Second todo');
      expect(todoTexts).toContain('Third todo');
    });
  });

  test.describe('GET /api/todos/:uuid', () => {
    test('should return specific todo by UUID', async ({ request }) => {
      // Создаем задачу
      const createResponse = await request.post('/api/todos', {
        data: { text: 'Specific todo' }
      });
      const createdTodo = await createResponse.json();

      // Получаем задачу по UUID
      const response = await request.get(`/api/todos/${createdTodo.uuid}`);
      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.uuid).toBe(createdTodo.uuid);
      expect(responseBody.text).toBe('Specific todo');
      expect(responseBody.completed).toBe(false);
    });

    test('should return 400 for invalid UUID format', async ({ request }) => {
      const response = await request.get('/api/todos/invalid-uuid');

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
      expect(responseBody.message).toContain('валидации');
    });

    test('should return 404 for non-existent todo', async ({ request }) => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request.get(`/api/todos/${validUuid}`);

      expect(response.status()).toBe(404);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
      expect(responseBody.message).toContain('not found');
    });
  });

  test.describe('PUT /api/todos/:uuid', () => {
    test('should update todo completely', async ({ request }) => {
      // Создаем задачу
      const createResponse = await request.post('/api/todos', {
        data: { text: 'Original todo' }
      });
      const createdTodo = await createResponse.json();

      // Обновляем задачу
      const updateData = { text: 'Updated todo', completed: true };
      const response = await request.put(`/api/todos/${createdTodo.uuid}`, {
        data: updateData
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.uuid).toBe(createdTodo.uuid);
      expect(responseBody.text).toBe('Updated todo');
      expect(responseBody.completed).toBe(true);
      expect(responseBody.updatedAt).not.toBe(createdTodo.updatedAt);
    });

    test('should return 400 for invalid UUID format', async ({ request }) => {
      const response = await request.put('/api/todos/invalid-uuid', {
        data: { text: 'Updated text' }
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
      expect(responseBody.message).toContain('валидации');
    });

    test('should return 404 for non-existent todo', async ({ request }) => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request.put(`/api/todos/${validUuid}`, {
        data: { text: 'Updated text' }
      });

      expect(response.status()).toBe(404);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
      expect(responseBody.message).toContain('not found');
    });
  });

  test.describe('PATCH /api/todos/:uuid', () => {
    test('should update todo partially - text only', async ({ request }) => {
      // Создаем задачу
      const createResponse = await request.post('/api/todos', {
        data: { text: 'Original todo' }
      });
      const createdTodo = await createResponse.json();

      // Частично обновляем задачу (только текст)
      const response = await request.patch(`/api/todos/${createdTodo.uuid}`, {
        data: { text: 'Partially updated todo' }
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.uuid).toBe(createdTodo.uuid);
      expect(responseBody.text).toBe('Partially updated todo');
      expect(responseBody.completed).toBe(false); // Должно остаться неизменным
    });

    test('should update todo partially - completed only', async ({ request }) => {
      // Создаем задачу
      const createResponse = await request.post('/api/todos', {
        data: { text: 'Todo to complete' }
      });
      const createdTodo = await createResponse.json();

      // Частично обновляем задачу (только статус)
      const response = await request.patch(`/api/todos/${createdTodo.uuid}`, {
        data: { completed: true }
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody.uuid).toBe(createdTodo.uuid);
      expect(responseBody.text).toBe('Todo to complete'); // Должно остаться неизменным
      expect(responseBody.completed).toBe(true);
    });

    test('should return 400 for empty update data', async ({ request }) => {
      // Создаем задачу
      const createResponse = await request.post('/api/todos', {
        data: { text: 'Some todo' }
      });
      const createdTodo = await createResponse.json();

      // Пытаемся обновить с пустыми данными
      const response = await request.patch(`/api/todos/${createdTodo.uuid}`, {
        data: {}
      });

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
      expect(responseBody.message).toContain('валидации');
    });
  });

  test.describe('DELETE /api/todos/:uuid', () => {
    test('should delete todo successfully', async ({ request }) => {
      // Создаем задачу
      const createResponse = await request.post('/api/todos', {
        data: { text: 'Todo to delete' }
      });
      const createdTodo = await createResponse.json();

      // Удаляем задачу
      const response = await request.delete(`/api/todos/${createdTodo.uuid}`);
      expect(response.status()).toBe(204);

      // Проверяем, что задача действительно удалена
      const getResponse = await request.get(`/api/todos/${createdTodo.uuid}`);
      expect(getResponse.status()).toBe(404);
    });

    test('should return 400 for invalid UUID format', async ({ request }) => {
      const response = await request.delete('/api/todos/invalid-uuid');

      expect(response.status()).toBe(400);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
      expect(responseBody.message).toContain('валидации');
    });

    test('should return 404 for non-existent todo', async ({ request }) => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request.delete(`/api/todos/${validUuid}`);

      expect(response.status()).toBe(404);
      
      const responseBody = await response.json();
      expect(responseBody.status).toBe('error');
      expect(responseBody.message).toContain('not found');
    });
  });

  test.describe('API Data Flow Integration', () => {
    test('should handle complete todo lifecycle', async ({ request }) => {
      // 1. Создаем задачу
      const createResponse = await request.post('/api/todos', {
        data: { text: 'Lifecycle test todo' }
      });
      expect(createResponse.status()).toBe(201);
      const todo = await createResponse.json();

      // 2. Получаем созданную задачу
      const getResponse = await request.get(`/api/todos/${todo.uuid}`);
      expect(getResponse.status()).toBe(200);
      const fetchedTodo = await getResponse.json();
      expect(fetchedTodo.text).toBe('Lifecycle test todo');
      expect(fetchedTodo.completed).toBe(false);

      // 3. Обновляем текст задачи
      const updateTextResponse = await request.patch(`/api/todos/${todo.uuid}`, {
        data: { text: 'Updated lifecycle todo' }
      });
      expect(updateTextResponse.status()).toBe(200);
      const updatedTodo = await updateTextResponse.json();
      expect(updatedTodo.text).toBe('Updated lifecycle todo');
      expect(updatedTodo.completed).toBe(false);

      // 4. Отмечаем как выполненную
      const completeResponse = await request.patch(`/api/todos/${todo.uuid}`, {
        data: { completed: true }
      });
      expect(completeResponse.status()).toBe(200);
      const completedTodo = await completeResponse.json();
      expect(completedTodo.completed).toBe(true);
      expect(completedTodo.text).toBe('Updated lifecycle todo');

      // 5. Удаляем задачу
      const deleteResponse = await request.delete(`/api/todos/${todo.uuid}`);
      expect(deleteResponse.status()).toBe(204);

      // 6. Проверяем, что задача удалена
      const finalGetResponse = await request.get(`/api/todos/${todo.uuid}`);
      expect(finalGetResponse.status()).toBe(404);
    });
  });
});
