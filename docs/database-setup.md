# PostgreSQL Test Database Setup

This project uses a local PostgreSQL database for testing via Podman or Docker containers.

## Quick Start

1. **Setup the test database:**
   ```bash
   npm run db:setup
   ```

2. **Run API tests:**
   ```bash
   npm run test:api
   ```

## Database Management Commands

The database helper is implemented as a cross-platform Node.js script: `scripts/db-test.js`.

- `npm run db:setup` - Complete setup and wait until PostgreSQL is ready
- `npm run db:start` - Start the PostgreSQL container
- `npm run db:stop` - Stop the PostgreSQL container
- `npm run db:restart` - Restart the PostgreSQL container
- `npm run db:status` - Check container status
- `npm run db:logs` - View database logs

By default the helper prefers Podman and falls back to Docker. To force a runtime:

```bash
CONTAINER_RUNTIME=docker npm run db:setup
CONTAINER_RUNTIME=podman npm run db:setup
```

## Manual Setup

If you prefer to set up manually:

1. **Start Podman machine when using Podman on macOS/Windows:**
   ```bash
   podman machine start
   ```

2. **Create and start PostgreSQL container:**
   ```bash
   podman run --name postgres-test \
     -e POSTGRES_DB=todo_test \
     -e POSTGRES_USER=testuser \
     -e POSTGRES_PASSWORD=testpass \
     -p 5433:5432 \
     -d postgres:15
   ```

   Docker equivalent:
   ```bash
   docker run --name postgres-test \
     -e POSTGRES_DB=todo_test \
     -e POSTGRES_USER=testuser \
     -e POSTGRES_PASSWORD=testpass \
     -p 5433:5432 \
     -d postgres:15
   ```

3. **Run tests:**
   ```bash
   npm run test:api
   ```

## Database Configuration

- **Host:** localhost
- **Port:** 5433
- **Database:** todo_test
- **Username:** testuser
- **Password:** testpass
- **Connection String:** `postgresql://testuser:testpass@localhost:5433/todo_test`

## Script Configuration

You can override defaults with environment variables:

- `CONTAINER_RUNTIME` - `podman` or `docker`
- `DB_CONTAINER_NAME` - container name, default `postgres-test`
- `POSTGRES_DB` - database name, default `todo_test`
- `POSTGRES_USER` - database user, default `testuser`
- `POSTGRES_PASSWORD` - database password, default `testpass`
- `POSTGRES_PORT` - host port, default `5433`
- `POSTGRES_IMAGE` - container image, default `postgres:15`

## Architecture

The application automatically detects the environment:

- **Test/Local:** Uses standard `pg` client to connect to local PostgreSQL
- **Production:** Uses Vercel Postgres database through environment variables

Detection logic:
- If `NODE_ENV=test` OR `POSTGRES_URL` contains `localhost` → local PostgreSQL
- Otherwise → hosted PostgreSQL / Vercel Postgres

## Troubleshooting

1. **Container not starting:** make sure Podman or Docker is installed and running.
2. **Podman on macOS/Windows:** run `podman machine start`, or use `npm run db:setup` to let the helper try it automatically.
3. **Port conflicts:** check if port `5433` is available or change it through `POSTGRES_PORT`.
4. **Connection refused:** run `npm run db:logs` and check whether PostgreSQL is ready.
