# Stage Smoke Tests

Stage smoke tests verify the deployed stage environment, not the local app.

They are intentionally separate from the normal local/CI Playwright suite.

## Command

```bash
STAGE_BASE_URL=https://your-stage-url.vercel.app npm run test:stage
```

Or create a local `.env.stage` file:

```text
STAGE_BASE_URL=https://your-stage-url.vercel.app
```

Then run:

```bash
npm run test:stage
```

## What the tests verify

### `tests/stage/health.spec.js`

Checks that stage:

- responds to `/health` with HTTP 200;
- reports `status: "ok"`;
- uses `storage: "postgres"`;
- has `db: true`;
- has `fallbackActivated: false`;
- reports `appEnv: "stage"`;
- exposes expected diagnostic flags through `/diag`.

### `tests/stage/todos-stage.spec.js`

Checks that stage can perform a minimal real API flow:

1. create one TODO;
2. read the created TODO;
3. update it;
4. remove it;
5. verify it is no longer available.

The test removes only the record it created. It does not perform a bulk cleanup.

## Required stage environment variables

The deployed stage app should be configured with:

```text
APP_ENV=stage
DATABASE_URL=<stage-postgres-url>
REQUIRE_DATABASE=true
ENABLE_TEST_ROUTES=true
ALLOW_TEST_DATA_RESET=true
ALLOW_MEMORY_FALLBACK=false
```

`ENABLE_TEST_ROUTES` and `ALLOW_TEST_DATA_RESET` are still required for broader stage testing, but the current smoke test does not rely on bulk cleanup.

## Success criteria

Stage is considered ready for promotion only when:

```bash
npm run db:migrate
npm run db:smoke
npm run test:stage
```

all pass against the stage database and stage deployment.

## Production rule

Do not run stage tests against production.

Production must use:

```text
APP_ENV=prod
ENABLE_TEST_ROUTES=false
ALLOW_TEST_DATA_RESET=false
```
