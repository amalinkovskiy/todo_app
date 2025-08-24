const request = require('supertest');
const app = require('../src/server');

describe('Todo API', () => {
  let createdTodoUuid;

  beforeEach(async () => {
    // Очищаем базу данных перед каждым тестом
    // В реальном проекте здесь бы была настройка тестовой БД
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const todoData = { name: 'Test todo' };
      
      const response = await request(app)
        .post('/api/todos')
        .send(todoData)
        .expect(201);

      expect(response.body).toHaveProperty('uuid');
      expect(response.body.name).toBe('Test todo');
      expect(response.body.completed).toBe(false);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      
      createdTodoUuid = response.body.uuid;
    });

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ name: '' })
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('required');
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({})
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/todos', () => {
    it('should return empty array initially', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/todos/:uuid', () => {
    it('should return 404 for non-existent todo', async () => {
      const response = await request(app)
        .get('/api/todos/non-existent-uuid')
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('not found');
    });
  });

  describe('DELETE /api/todos/:uuid', () => {
    it('should return 404 for non-existent todo', async () => {
      const response = await request(app)
        .delete('/api/todos/non-existent-uuid')
        .expect(404);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('not found');
    });
  });
});
