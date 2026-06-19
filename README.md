# TODO App

A small TypeScript TODO application used as a practical playground for API/UI testing, Playwright MCP, GitHub Actions, living-requirements verification, and stage/prod deployment hardening.

## Current State

The current implementation is:

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** static HTML/CSS + TypeScript compiled into `public/script.js`
- **Validation:** Zod schemas and Express validation middleware
- **Storage:** PostgreSQL when a database URL is configured; JSON file fallback in local/test mode; in-memory fallback only when explicitly allowed in unguarded serverless mode
- **Environments:** explicit `stage`/`prod` guards through environment variables
- **Testing:** Playwright API and UI tests
- **CI:** GitHub Actions on `ubuntu-latest`
- **Requirements traceability:** markdown feature files mapped to executed Playwright tests through `scripts/verify-test-coverage.ts`

## Features

- Add a TODO item
- List TODO items
- Mark a TODO item as completed
- Edit TODO text
- Delete a TODO item with confirmation modal
- REST API for TODO CRUD operations
- Health and diagnostic endpoints
- PostgreSQL migration and smoke-check scripts
- Playwright API/UI test coverage
- Playwright MCP available for assisted test generation

## Architecture Overview

```text
Browser
  -> public/index.html
  -> public/styles.css
  -> public/script.js
       -> /api/todos

Express server
  -> src/server.ts
  -> src/api/todo.routes.ts
  -> src/controllers/todo.controller.ts
  -> src/services/todo.service.ts
  -> src/validators/todo.validator.ts
```

### Backend

Main local entry point:

```text
src/server.ts
```

Vercel serverless entry point:

```text
api/index.ts
```

Responsibilities:

- Load environment variables
- Configure Express middleware
- Serve static frontend assets from `public/`
- Register API routes under `/api/todos`
- Register test helper routes under `/api/test` only when `ENABLE_TEST_ROUTES=true`
- Expose `/health` and `/diag`
- Serve `public/index.html` as SPA fallback for non-API routes

### API Routes

Main route file:

```text
src/api/todo.routes.ts
```

Available TODO endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/todos` | Get all TODOs |
| `GET` | `/api/todos/:uuid` | Get one TODO by UUID |
| `POST` | `/api/todos` | Create TODO |
| `PUT` | `/api/todos/:uuid` | Full TODO update |
| `PATCH` | `/api/todos/:uuid` | Partial TODO update |
| `DELETE` | `/api/todos/:uuid` | Delete TODO |
| `DELETE` | `/api/todos` | Clear all TODOs through the main API controller |

Test helper route:

```text
/api/test/*
```

This route is mounted only when:

```text
ENABLE_TEST_ROUTES=true
```

The destructive test cleanup endpoint requires:

```text
ALLOW_TEST_DATA_RESET=true
```

### Validation

Validation lives in:

```text
src/validators/todo.validator.ts
```

The project uses **Zod**, not Joi.

Current validation rules:

- `text` is required for create
- `text` is trimmed
- `text` must not be empty
- `text` max length is 500 characters
- `completed` is optional for update
- route params must contain a valid UUID
- update body must contain at least one updatable field

### Storage Modes

Storage is implemented in:

```text
src/services/todo.service.ts
```

Current behavior:

| Runtime condition | Storage mode |
|---|---|
| `POSTGRES_URL` or `DATABASE_URL` exists | PostgreSQL |
| `REQUIRE_DATABASE=true` and no DB URL exists | no fallback; `/health` is degraded |
| `NODE_ENV=test` without required DB | JSON file storage fallback |
| no database URL in normal local mode | JSON file storage fallback |
| Vercel/serverless without DB URL and DB not required | in-memory fallback |

Important: stage and production should set `REQUIRE_DATABASE=true`, so they never silently use file or memory storage.

### Frontend

Frontend source:

```text
src/frontend/script.ts
```

Compiled output:

```text
public/script.js
```

Static page:

```text
public/index.html
```

The frontend calls `/api/todos` directly and renders the TODO list in the browser.

## Environment Model

The intended deployment model is documented in:

```text
docs/environments.md
```

### Stage

Stage receives new changes first and is safe for automated test cleanup.

Recommended variables:

```text
APP_ENV=stage
DATABASE_URL=<stage-postgres-url>
REQUIRE_DATABASE=true
ENABLE_TEST_ROUTES=true
ALLOW_TEST_DATA_RESET=true
ALLOW_MEMORY_FALLBACK=false
```

### Production

Production receives only validated changes and must never run destructive test cleanup.

Recommended variables:

```text
APP_ENV=prod
DATABASE_URL=<prod-postgres-url>
REQUIRE_DATABASE=true
ENABLE_TEST_ROUTES=false
ALLOW_TEST_DATA_RESET=false
ALLOW_MEMORY_FALLBACK=false
```

## Requirements Traceability

Feature files live in:

```text
features/*.md
```

The verification script lives in:

```text
scripts/verify-test-coverage.ts
```

It checks that every markdown scenario has matching Playwright test metadata:

```text
Test file: `...`
Test name: `...`
```

The script reads Playwright JSON results from:

```text
playwright-report/results.json
```

This is the current lightweight version of living requirements: feature scenarios are not just documentation; they must map to executed tests.

## Quick Start

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

App URL:

```text
http://localhost:3000
```

### Build

```bash
npm run build
```

This compiles backend TypeScript into `dist/` and frontend TypeScript into `public/`.

### Start compiled app

```bash
npm start
```

## Testing

### Run the full local test path

```bash
npm test
```

This runs Playwright tests and then verifies requirements coverage.

### Run the CI-equivalent path

```bash
npm run test:ci
```

This runs:

1. TypeScript build
2. Playwright tests
3. Requirements coverage verification

### Run API tests only

```bash
npm run test:api
```

### Run UI tests only

```bash
npm run test:ui
```

### Run UI tests headed

```bash
npm run test:headed
```

### Debug UI tests

```bash
npm run test:debug
```

### Open Playwright report

```bash
npm run test:report
```

## CI

GitHub Actions workflow:

```text
.github/workflows/ci.yml
```

Current CI runs on:

```text
ubuntu-latest
```

Main CI command:

```bash
npm run test:ci
```

The workflow also uploads the Playwright HTML report as an artifact when the run completes.

## Database Lifecycle

### Local PostgreSQL container helper

The project includes a cross-platform Node.js helper for local PostgreSQL container management:

```text
scripts/db-test.js
```

It prefers Podman when available and falls back to Docker.

Commands:

```bash
npm run db:setup
npm run db:start
npm run db:stop
npm run db:restart
npm run db:status
npm run db:logs
```

Default PostgreSQL connection string:

```text
postgresql://testuser:testpass@localhost:5433/todo_test
```

You can force container runtime:

```bash
CONTAINER_RUNTIME=docker npm run db:setup
CONTAINER_RUNTIME=podman npm run db:setup
```

### Migrations

SQL migrations live in:

```text
db/migrations/*.sql
```

Run migrations against the configured `DATABASE_URL` or `POSTGRES_URL`:

```bash
npm run db:migrate
```

### Database smoke check

After migrations, verify the real PostgreSQL path:

```bash
npm run db:smoke
```

The smoke check verifies connection, table existence, insert, read, update, and delete using a temporary row.

## Playwright MCP

Playwright MCP is available as an assisted workflow for generating and exploring tests.

```bash
npm run mcp:help
npm run mcp:generate
```

Recommended workflow:

1. Use MCP to explore or generate a draft.
2. Review the generated scenario manually.
3. Refactor into the project test style.
4. Put stable tests into `tests/api/` or `tests/ui/`.
5. Keep feature files in `features/` synchronized with real executed tests.

## Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml
├── data/
│   └── todos.json
├── db/
│   └── migrations/
│       └── 001_create_todos.sql
├── docs/
│   ├── database-setup.md
│   ├── environments.md
│   └── playwright-mcp-guide.md
├── features/
│   ├── 001-todo-crud.feature.md
│   ├── 002-ui-todo.feature.md
│   ├── 003-ui-accessibility.feature.md
│   └── 004-ui-responsive.feature.md
├── public/
│   ├── index.html
│   ├── script.js
│   ├── script.js.map
│   └── styles.css
├── scripts/
│   ├── db-migrate.ts
│   ├── db-smoke.ts
│   ├── db-test.js
│   └── verify-test-coverage.ts
├── src/
│   ├── api/
│   │   ├── test.routes.ts
│   │   └── todo.routes.ts
│   ├── config/
│   │   └── index.ts
│   ├── controllers/
│   │   └── todo.controller.ts
│   ├── frontend/
│   │   ├── script.ts
│   │   └── tsconfig.json
│   ├── middlewares/
│   │   └── errorHandler.ts
│   ├── services/
│   │   └── todo.service.ts
│   ├── validators/
│   │   └── todo.validator.ts
│   └── server.ts
├── tests/
│   ├── api/
│   │   └── todos.spec.js
│   ├── helpers/
│   │   └── api-helpers.ts
│   └── ui/
│       ├── accessibility.spec.js
│       ├── page-objects/
│       │   └── todo.page.ts
│       ├── responsive.spec.js
│       └── todo.spec.js
├── api/
│   └── index.ts
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.json
├── vercel.json
└── README.md
```

## Useful Health Endpoints

### Health

```http
GET /health
```

Expected healthy stage/production response:

```json
{
  "status": "ok",
  "db": true,
  "storage": "postgres",
  "fallbackActivated": false,
  "appEnv": "stage",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Fallback/degraded response:

```json
{
  "status": "degraded",
  "db": false,
  "storage": "file",
  "fallbackActivated": false,
  "appEnv": "local",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### Diagnostics

```http
GET /diag
```

Returns non-sensitive runtime diagnostics such as `APP_ENV`, `NODE_ENV`, whether Vercel is detected, whether database URL variables are present, and whether test routes/data reset are enabled.

## Development Notes

- Keep commands cross-platform and Ubuntu-friendly.
- Do not reintroduce PowerShell-only project scripts.
- Keep README aligned with the actual TypeScript structure.
- Keep feature files mapped to real Playwright tests.
- Stage can run destructive test cleanup only when explicitly enabled.
- Production must never enable test routes or destructive data reset.
- Prefer small PRs with one clear purpose.
