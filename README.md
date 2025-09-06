# TODO App with Playwright MCP Integration

🎉 **A professional TODO application with full testing integration and Playwright MCP!**

## Core Features

- ✅ Add new tasks
- ✅ Mark tasks as completed
- ✅ Edit task titles
- ✅ Delete tasks with confirmation
- ✅ REST API with data validation
- ✅ Full test coverage (API + UI)
- ✅ Playwright MCP to assist in creating tests

## Implemented

### 🏗️ Architecture
- ✅ Node.js + Express.js (MVC)
- ✅ Server-side rendering (EJS)
- ✅ PostgreSQL database with dual-environment support
- ✅ Data validation using `express-validator`
- ✅ Test environment setup (`.env.test`)
- ✅ Responsive UI with modals
- ✅ Podman containerization for local development

### 🧪 Testing
- **Single test framework:** Playwright for both API and UI tests.
- **Comprehensive coverage:** Includes API, UI, responsive layout, and accessibility tests.
- **Full data isolation:** Ensures stable execution.
- **Test “incubator”:** The `mcp-generated` folder is used as a temporary place for auto-generated tests before refactoring.

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

**Prerequisites**: Install [Podman](https://podman.io/getting-started/installation) for containerized PostgreSQL.

#### Quick Setup
```powershell
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
```powershell
# Create and start PostgreSQL container
podman run --name postgres-todo-test -e POSTGRES_USER=testuser -e POSTGRES_PASSWORD=testpass -e POSTGRES_DB=todo_test -p 5433:5432 -d postgres:15

# Initialize test database
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
```bash
# Database Management
npm run db:start         # Start PostgreSQL container
npm run db:stop          # Stop PostgreSQL container
npm run db:status        # Check database status
npm run db:logs          # View database logs
npm run db:setup         # Initialize database

# Test Execution
npm test                 # Run all API and UI tests (19 API + UI tests)
npm run test:api         # API tests only (19 tests)
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
│   └── db-test.ps1         # Database management automation
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
