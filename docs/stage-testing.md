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

1. clean up old smoke-test-owned TODOs with the `stage-smoke-` prefix;
2. create one TODO with a unique `stage-smoke-...` text value;
3. read the created TODO;
4. update it;
5. remove it;
6. verify it is no longer available;
7. clean up any remaining smoke-test-owned TODOs with the `stage-smoke-` prefix.

The test only removes records whose text starts with `stage-smoke-`. It does not delete manual stage data and does not perform a full database cleanup.

## Test data policy

Stage data is disposable, but tests must clean up only data they own.

Rules:

- automated smoke tests must create records with the `stage-smoke-` prefix;
- automated smoke tests may delete only records with the `stage-smoke-` prefix;
- manual test records such as `task1`, `task2`, or exploratory data must not be removed by automation;
- production must never allow destructive test cleanup.

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
