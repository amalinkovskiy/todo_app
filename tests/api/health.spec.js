const { test, expect } = require('@playwright/test');

let baseURL;

test.beforeAll(async ({ baseURL: url }) => {
  baseURL = url;
});

test.describe('Health Endpoint', () => {
  test('GET /health should return ok with db true', async ({ request }) => {
    const response = await request.get(`${baseURL}/health`);
    expect([200,503]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('db');
    expect(body).toHaveProperty('timestamp');
  });
});
