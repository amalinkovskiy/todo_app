const { test, expect } = require('@playwright/test');

test.describe('Stage health smoke', () => {
  test('stage health reports PostgreSQL storage', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.status(), 'stage /health must return 200').toBe(200);

    const body = await response.json();

    expect(body.status).toBe('ok');
    expect(body.db).toBe(true);
    expect(body.storage).toBe('postgres');
    expect(body.fallbackActivated).toBe(false);
    expect(body.appEnv).toBe('stage');
  });

  test('stage diagnostics expose expected flags', async ({ request }) => {
    const response = await request.get('/diag');

    expect(response.status(), 'stage /diag must return 200').toBe(200);

    const body = await response.json();

    expect(body.status).toBe('diag-ok');
    expect(body.env.appEnv).toBe('stage');
    expect(body.env.hasPostgresUrl || body.env.hasDatabaseUrl).toBe(true);
    expect(body.env.requireDatabase).toBe(true);
    expect(body.env.enableTestRoutes).toBe(true);
    expect(body.env.allowTestDataReset).toBe(true);
  });
});
