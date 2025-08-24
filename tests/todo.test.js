const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

describe('Todo API', () => {
  let app;
  let createdTodoUuid;
  const testDbPath = './data/test-todos.json';

  beforeAll(async () => {
    // Set test database path before requiring the server
    process.env.DB_FILE = testDbPath;
    // Require the app only after setting the environment variable
    app = require('../src/server');
  });

  beforeEach(async () => {
    // Clean test database before each test
    try {
      const testData = { todos: [] };
      await fs.mkdir(path.dirname(testDbPath), { recursive: true });
      await fs.writeFile(testDbPath, JSON.stringify(testData, null, 2));
      
      // Force service to reload the data
      const todoService = require('../src/services/todo.service');
      await todoService.init();
    } catch (error) {
      console.error('Failed to setup test database:', error);
    }
  });

  afterAll(async () => {
    // Clean up test database
    try {
      await fs.unlink(testDbPath);
    } catch (error) {
      // File might not exist, ignore error
    }
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const todoData = { text: 'Test todo' };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData)
        .expect(201);

      expect(response.body).toHaveProperty('uuid');
      expect(response.body.text).toBe('Test todo');
      expect(response.body.completed).toBe(false);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      createdTodoUuid = response.body.uuid;
    });

    it('should return 400 for empty text', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '' })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('валидации');
    });

    it('should return 400 for missing text', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({})
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('валидации');
    });
  });

  describe('GET /api/todos', () => {
    it('should return empty array initially', async () => {
      const response = await request(app).get('/api/todos').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/todos/:uuid', () => {
    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/todos/invalid-uuid')
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('валидации');
    });

    it('should return 404 for non-existent todo', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/api/todos/${validUuid}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/todos/:uuid', () => {
    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .delete('/api/todos/invalid-uuid')
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('валидации');
    });

    it('should return 404 for non-existent todo', async () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .delete(`/api/todos/${validUuid}`)
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('not found');
    });
  });
});
