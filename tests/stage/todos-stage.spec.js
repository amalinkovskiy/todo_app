const { test, expect } = require('@playwright/test');

const STAGE_SMOKE_PREFIX = 'stage-smoke-';

async function cleanupStageSmokeTodos(request) {
  const listResponse = await request.get('/api/todos');

  if (!listResponse.ok()) {
    return;
  }

  const todos = await listResponse.json();

  if (!Array.isArray(todos)) {
    return;
  }

  const smokeTodos = todos.filter((todo) =>
    typeof todo.text === 'string' && todo.text.startsWith(STAGE_SMOKE_PREFIX),
  );

  await Promise.all(
    smokeTodos.map((todo) => request.delete(`/api/todos/${todo.uuid}`).catch(() => undefined)),
  );
}

test.describe('Stage TODO API smoke', () => {
  test.beforeEach(async ({ request }) => {
    await cleanupStageSmokeTodos(request);
  });

  test.afterEach(async ({ request }) => {
    await cleanupStageSmokeTodos(request);
  });

  test('can create, read, update, and remove one TODO on stage', async ({ request }) => {
    const uniqueText = `${STAGE_SMOKE_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let createdUuid;

    try {
      const createResponse = await request.post('/api/todos', {
        data: { text: uniqueText },
      });

      expect(createResponse.status(), 'create TODO should return 201').toBe(201);

      const createdTodo = await createResponse.json();
      createdUuid = createdTodo.uuid;

      expect(createdTodo.uuid).toBeTruthy();
      expect(createdTodo.text).toBe(uniqueText);
      expect(createdTodo.completed).toBe(false);

      const readResponse = await request.get(`/api/todos/${createdUuid}`);
      expect(readResponse.status(), 'read TODO should return 200').toBe(200);

      const readTodo = await readResponse.json();
      expect(readTodo.uuid).toBe(createdUuid);
      expect(readTodo.text).toBe(uniqueText);

      const updateResponse = await request.patch(`/api/todos/${createdUuid}`, {
        data: { completed: true },
      });

      expect(updateResponse.status(), 'update TODO should return 200').toBe(200);

      const updatedTodo = await updateResponse.json();
      expect(updatedTodo.uuid).toBe(createdUuid);
      expect(updatedTodo.completed).toBe(true);

      const removeResponse = await request.delete(`/api/todos/${createdUuid}`);
      expect(removeResponse.status(), 'remove TODO should return 204').toBe(204);

      const readRemovedResponse = await request.get(`/api/todos/${createdUuid}`);
      expect(readRemovedResponse.status(), 'removed TODO should return 404').toBe(404);

      createdUuid = undefined;
    } finally {
      if (createdUuid) {
        await request.delete(`/api/todos/${createdUuid}`).catch(() => undefined);
      }
    }
  });
});
