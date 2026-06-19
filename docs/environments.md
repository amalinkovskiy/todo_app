# Stage and Production Environments

This project uses two deployment environments with different safety rules.

## Goals

- **Stage** receives new changes first and is safe for automated tests.
- **Production** receives only validated changes and must never run destructive test cleanup.
- Both environments must use a real PostgreSQL database.
- Fallback storage is acceptable for local development, but not for stage or production.

## Environment Model

| Environment | Purpose | Database | Test routes | Data reset |
|---|---|---|---|---|
| `stage` | Validate new changes and run tests | Stage PostgreSQL | Enabled | Allowed |
| `prod` | Stable user-facing app | Production PostgreSQL | Disabled | Forbidden |

## Required Variables

### Stage

```text
APP_ENV=stage
DATABASE_URL=<stage-postgres-url>
REQUIRE_DATABASE=true
ENABLE_TEST_ROUTES=true
ALLOW_TEST_DATA_RESET=true
ALLOW_MEMORY_FALLBACK=false
```

Optional:

```text
DEBUG_HEALTH=1
DISABLE_DB_SSL=true
```

Use `DISABLE_DB_SSL=true` only for trusted local containers. Managed PostgreSQL providers usually require SSL.

### Production

```text
APP_ENV=prod
DATABASE_URL=<prod-postgres-url>
REQUIRE_DATABASE=true
ENABLE_TEST_ROUTES=false
ALLOW_TEST_DATA_RESET=false
ALLOW_MEMORY_FALLBACK=false
```

Production must use a separate database from stage.

## Database Migration

Run migrations against the currently configured `DATABASE_URL` or `POSTGRES_URL`:

```bash
npm run db:migrate
```

Current migration files live in:

```text
db/migrations/*.sql
```

The first migration creates the `todos` table if it does not exist.

## Database Smoke Check

After migrations, verify the real database path:

```bash
npm run db:smoke
```

The smoke check validates that:

- PostgreSQL is reachable.
- The `todos` table exists.
- A TODO can be inserted.
- The inserted TODO can be read.
- The TODO can be updated.
- The TODO can be deleted.

The smoke check creates and deletes only its own temporary row.

## Health Check Expectations

Endpoint:

```http
GET /health
```

Stage and production are healthy only when:

```json
{
  "status": "ok",
  "db": true,
  "storage": "postgres",
  "fallbackActivated": false
}
```

If `/health` returns `storage: "file"` or `storage: "memory"`, the deployed environment is not production-like.

## Diagnostic Endpoint

Endpoint:

```http
GET /diag
```

This endpoint exposes non-sensitive runtime diagnostics:

- `APP_ENV`
- whether `POSTGRES_URL` or `DATABASE_URL` is present
- whether `REQUIRE_DATABASE` is enabled
- whether test routes are enabled
- whether test data reset is allowed

It never returns raw secret values.

## Test Routes

Test routes are mounted only when:

```text
ENABLE_TEST_ROUTES=true
```

The destructive clear route is allowed only when:

```text
ALLOW_TEST_DATA_RESET=true
```

Safe stage behavior:

```text
ENABLE_TEST_ROUTES=true
ALLOW_TEST_DATA_RESET=true
```

Safe production behavior:

```text
ENABLE_TEST_ROUTES=false
ALLOW_TEST_DATA_RESET=false
```

## Deployment Rules

### Stage

1. Deploy new changes to stage first.
2. Run migrations against the stage database.
3. Run DB smoke check.
4. Run API/UI/stage tests.
5. Verify `/health` reports real PostgreSQL.

### Production

1. Deploy only after stage is green.
2. Run only safe migrations.
3. Never enable test routes.
4. Never enable test data reset.
5. Never clean or seed production data destructively.

## Production Safety Rules

Forbidden in production:

- `ENABLE_TEST_ROUTES=true`
- `ALLOW_TEST_DATA_RESET=true`
- manual data cleanup used for tests
- test seed scripts that delete existing data
- truncating tables
- dropping tables as part of normal deploy

Allowed in production:

- safe additive migrations
- health checks
- normal application CRUD operations
- smoke checks that create and delete only their own temporary record, if explicitly approved

## Recommended Flow

```text
feature branch
  -> PR to stage
  -> deploy stage
  -> migrate stage DB
  -> run stage tests
  -> merge/promote to main
  -> deploy production
```

`main` should represent production-ready code only.
