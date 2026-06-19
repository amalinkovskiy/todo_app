# TODO App with Playwright MCP Integration

🎉 **A professional TODO application with full testing integration and Playwright MCP!**

## Core Features

- ✅ Add new tasks
- ✅ Mark tasks as completed
- ✅ Edit task titles
- ✅ Delete tasks with confirmation
- ✅ REST API with data validation
- ✅ Health check endpoint (`GET /health`)
- ✅ Full test coverage (API + UI)
- ✅ Playwright MCP to assist in creating tests

## Implemented

### 🏗️ Architecture
- ✅ Node.js + Express.js (MVC)
- ✅ PostgreSQL database (single pg Pool)
- ✅ Data validation using Joi
- ✅ Test environment setup (`.env.test`)
- ✅ Responsive UI
- ✅ Podman/Docker containerization for local development
- ✅ Ubuntu-based GitHub Actions CI
- ✅ Serverless-friendly design (Vercel rewrites to single entry)

### 🧪 Testing
- **Single test framework:** Playwright for API, UI, responsiveness, accessibility.
- **Live production test suite:** Separate config hitting deployed Vercel URL.
- **Health endpoint covered:** `/health` basic availability & DB connectivity.
- **Full data isolation:** Ensures stable execution.
- **Generated test staging:** Temporary drafts refined before inclusion.

### 🎭 Playwright MCP Integration
- **Official `@playwright/mcp`** installed and configured.
- **Test generation** based on user scenarios.
- **Intelligent analysis** of existing tests.

## 💡 MCP Workflow

We use MCP as an assistant to speed up writing tests while maintaining high code quality:

1. **Generate:** Use MCP to create a draft test in `tests/mcp-generated/`.
2. **Review:** Analyze the generated code for redundancy and correctness.
3. **Refactor:** Rewrite the test to match project standards (e.g., declarative style).
4. **Integrate:** Move the refined test into `tests/ui/`.
5. **Clean up:** Delete the original draft from `mcp-generated`.

This keeps the main test suite clean while leveraging MCP for routine work.

## Quick Start

### ⚙️ Install
```bash
npm install
```

### 🗄️ Database Setup

**Prerequisites**: Install [Podman](https://podman.io/getting-started/installation) or Docker for containerized PostgreSQL.

The database helper is a cross-platform Node.js script. It prefers Podman when available and falls back to Docker.

#### Quick Setup
```bash
# Start PostgreSQL container
npm run db:start

# Check database status
npm run db:status

# View database logs
npm run db:logs

# Stop database
npm run db:stop
```

#### Manual Setup
```bash
# Create and start PostgreSQL container with Podman
podman run --name postgres-test -e POSTGRES_USER=testuser -e POSTGRES_PASSWORD=testpass -e POSTGRES_DB=todo_test -p 5433:5432 -d postgres:15

# Or with Docker
docker run --name postgres-test -e POSTGRES_USER=testuser -e POSTGRES_PASSWORD=testpass -e POSTGRES_DB=todo_test -p 5433:5432 -d postgres:15

# Initialize test database helper
npm run db:setup
```

**Environment Configuration**:
- **Development**: Uses local PostgreSQL container (`postgresql://testuser:testpass@localhost:5433/todo_test`)
- **Production**: Uses Vercel Postgres (configured via environment variables)
- **Auto-detection**: Based on `NODE_ENV=test` or localhost in `POSTGRES_URL`

### 🚀 Run
```bash
npm run dev
```
App available at `http://localhost:3000`.

### 🧪 Testing
### 🩺 Health Check
```
GET /health
Response 200:
{
	"status": "ok",
	"db": true,
	"timestamp": "2025-09-06T12:34:56.789Z"
}

If DB not reachable -> HTTP 503 with:
{
	"status": "error",
	"db": false,
	"error": "<message>",
	"timestamp": "..."
}
```

Use this for uptime probes or CI smoke tests.
```bash
# Database Management
npm run db:start         # Start PostgreSQL container
npm run db:stop          # Stop PostgreSQL container
npm run db:restart       # Restart PostgreSQL container
npm run db:status        # Check database status
npm run db:logs          # View database logs
npm run db:setup         # Initialize database

# Test Execution
npm test                 # Run all API and UI tests and verify requirements coverage
npm run test:ci          # Build, run tests, and verify requirements coverage
npm run test:api         # API tests only
npm run test:ui          # UI tests only
npm run test:headed      # UI tests with browser
npm run test:debug       # Debug UI tests
npm run test:report      # Open HTML report
```

### 🎭 Playwright MCP
```bash
npm run mcp:help      # MCP command help
npm run mcp:generate  # Generate tests
```

## 📁 Project Structure
```
.
├── 📁 .vscode/
│   └── settings.json
├── 📁 data/
│   ├── todos.json          # Legacy JSON storage
│   └── todos.test.json     # Test data backup
├── 📁 docs/
│   ├── database-setup.md   # Database configuration guide
│   └── playwright-mcp-guide.md
├── 📁 scripts/
│   └── db-test.js          # Cross-platform database management automation
├── 📁 node_modules/
├── 📁 public/
│   └── css/
│       └── styles.css
├── 📁 src/
│   ├── 📁 config/
│   │   └── index.js
│   ├── 📁 controllers/
│   │   └── todo.controller.js
│   ├── 📁 models/
│   │   └── todo.model.js
│   ├── 📁 routes/
│   │   └── todo.routes.js
│   ├── 📁 services/
│   │   └── todo.service.js  # Dual database support (PostgreSQL + Vercel)
│   ├── 📁 utils/
│   │   └── validation.js
│   ├── 📁 views/
│   │   ├── partials/
│   │   │   ├── header.ejs
│   │   │   └── footer.ejs
│   │   └── index.ejs
│   ├── app.js
│   └── server.js
├── 📁 tests/
│   ├── 📁 api/
│   │   └── todos.spec.js    # 19 comprehensive API tests
│   ├── 📁 ui/
│   │   ├── todo.spec.js
│   │   ├── responsive.spec.js
│   │   └── accessibility.spec.js
│   ├── api-helpers.js       # API request utilities for tests
│   └── global-setup.js      # Global setup
├── .env                     # Production environment
├── .env.test               # Test environment (PostgreSQL)
├── .gitignore
├── package.json
├── package-lock.json
├── playwright.config.js
└── README.md
```
