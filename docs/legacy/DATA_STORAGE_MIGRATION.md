# Data Storage Migration

The application previously supported a JSON file fallback stored in `data/todos.json` (and a test file `data/todos.test.json`).

As of this revision, the service uses PostgreSQL exclusively via a single pg Pool (`todo.service.js`). The `dbFile` configuration option has been removed.

Removed artifacts:
- `data/todos.json`
- `data/todos.test.json`

Rationale:
- Prevent divergence between file and database sources.
- Reduce complexity and potential stale data issues.
- Lower cold start logic branches in serverless environment.

If a lightweight local dev fallback is ever needed again, consider creating a dedicated adapter implementing the same CRUD interface rather than inline conditional logic.
