const { test, expect } = require('@playwright/test');

/**
 * Production API Tests
 * These tests work without test-specific endpoints like /api/test/clear
 * They simulate real user behavior without cleanup endpoints
 */

let baseURL;
let createdTodos = []; // Track created todos for manual cleanup

test.beforeAll(async ({ baseURL: url }) => {
  baseURL = url;
});

test.afterAll(async ({ request }) => {
  // Manual cleanup of created todos
  for (const todo of createdTodos) {
    try {
      await request.delete(`${baseURL}/api/todos/${todo.uuid}`);
    } catch (error) {
      // Ignore cleanup errors in production testing
    }
  }
});

test.describe('Production Todo API Tests', () => {
  
  test('GET /api/todos - should return list of todos', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/todos`);
    expect(response.status()).toBe(200);
    
    const todos = await response.json();
    expect(Array.isArray(todos)).toBe(true);
  });

  test('POST /api/todos - should create a new todo', async ({ request }) => {
    const newTodo = { text: 'Production Test Todo' };
    
    const response = await request.post(`${baseURL}/api/todos`, {
      data: newTodo
    });
    
    expect(response.status()).toBe(201);
    const todo = await response.json();
    
    expect(todo).toHaveProperty('uuid');
    expect(todo.text).toBe(newTodo.text);
    expect(todo.completed).toBe(false);
    expect(todo).toHaveProperty('createdAt');
    expect(todo).toHaveProperty('updatedAt');
    
    // Track for cleanup
    createdTodos.push(todo);
  });

  test('GET /api/todos/:uuid - should get specific todo', async ({ request }) => {
    // First create a todo
    const newTodo = { text: 'Test specific todo' };
    const createResponse = await request.post(`${baseURL}/api/todos`, {
      data: newTodo
    });
    const createdTodo = await createResponse.json();
    createdTodos.push(createdTodo);
    
    // Then get it
    const response = await request.get(`${baseURL}/api/todos/${createdTodo.uuid}`);
    expect(response.status()).toBe(200);
    
    const todo = await response.json();
    expect(todo.uuid).toBe(createdTodo.uuid);
    expect(todo.text).toBe(newTodo.text);
  });

  test('PUT /api/todos/:uuid - should update todo', async ({ request }) => {
    // Create a todo first
    const newTodo = { text: 'Todo to update' };
    const createResponse = await request.post(`${baseURL}/api/todos`, {
      data: newTodo
    });
    const createdTodo = await createResponse.json();
    createdTodos.push(createdTodo);
    
    // Update it
    const updateData = { text: 'Updated todo text', completed: true };
    const response = await request.put(`${baseURL}/api/todos/${createdTodo.uuid}`, {
      data: updateData
    });
    
    expect(response.status()).toBe(200);
    const updatedTodo = await response.json();
    
    expect(updatedTodo.text).toBe(updateData.text);
    expect(updatedTodo.completed).toBe(true);
    expect(updatedTodo.uuid).toBe(createdTodo.uuid);
  });

  test('DELETE /api/todos/:uuid - should delete todo', async ({ request }) => {
    // Create a todo first
    const newTodo = { text: 'Todo to delete' };
    const createResponse = await request.post(`${baseURL}/api/todos`, {
      data: newTodo
    });
    const createdTodo = await createResponse.json();
    
    // Delete it
    const response = await request.delete(`${baseURL}/api/todos/${createdTodo.uuid}`);
    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result).toHaveProperty('message');
    
    // Verify it's deleted
    const getResponse = await request.get(`${baseURL}/api/todos/${createdTodo.uuid}`);
    expect(getResponse.status()).toBe(404);
  });

  test('GET /api/todos/:uuid - should return 404 for non-existent todo', async ({ request }) => {
    const nonExistentUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const response = await request.get(`${baseURL}/api/todos/${nonExistentUuid}`);
    expect(response.status()).toBe(404);
  });

  test('POST /api/todos - should validate required fields', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/todos`, {
      data: {}
    });
    
    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty('error');
  });

  test('POST /api/todos - should validate text field type', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/todos`, {
      data: { text: 123 }
    });
    
    expect(response.status()).toBe(400);
  });

  test('PUT /api/todos/:uuid - should return 404 for non-existent todo', async ({ request }) => {
    const nonExistentUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const response = await request.put(`${baseURL}/api/todos/${nonExistentUuid}`, {
      data: { text: 'Updated text' }
    });
    
    expect(response.status()).toBe(404);
  });

  test('DELETE /api/todos/:uuid - should return 404 for non-existent todo', async ({ request }) => {
    const nonExistentUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const response = await request.delete(`${baseURL}/api/todos/${nonExistentUuid}`);
    expect(response.status()).toBe(404);
  });

});
