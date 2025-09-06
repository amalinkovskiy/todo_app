# PostgreSQL Test Database Setup

This project uses a local PostgreSQL database for testing via Podman containers.

## Quick Start

1. **Setup the test database (first time only):**
   ```bash
   npm run db:setup
   ```

2. **Run API tests:**
   ```bash
   npm run test:api
   ```

## Database Management Commands

- `npm run db:setup` - Complete setup (starts Podman machine and creates database)
- `npm run db:start` - Start the PostgreSQL container
- `npm run db:stop` - Stop the PostgreSQL container
- `npm run db:status` - Check container status
- `npm run db:logs` - View database logs

## Manual Setup

If you prefer to set up manually:

1. **Start Podman machine:**
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

## Architecture

The application automatically detects the environment:

- **Test/Local:** Uses standard `pg` client to connect to local PostgreSQL
- **Production:** Uses `@vercel/postgres` for Vercel Postgres database

Detection logic:
- If `NODE_ENV=test` OR `POSTGRES_URL` contains "localhost" → Local PostgreSQL
- Otherwise → Vercel Postgres

## Troubleshooting

1. **Container not starting:** Make sure Podman machine is running (`podman machine start`)
2. **Port conflicts:** Check if port 5433 is available or change it in the scripts
3. **Connection refused:** Wait a few seconds after starting the container for PostgreSQL to initialize
