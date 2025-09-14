"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env.local
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '..', '.env.local') });
const config_1 = __importDefault(require("./config"));
const todo_routes_1 = __importDefault(require("./api/todo.routes"));
const test_routes_1 = __importDefault(require("./api/test.routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
// Lightweight request logging (method, path, status, duration)
app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    // When response finishes, log details
    res.on('finish', () => {
        const durationNs = Number(process.hrtime.bigint() - start);
        const durationMs = (durationNs / 1e6).toFixed(1);
        // Avoid noisy logs for health checks (optional)
        if (req.path === '/health')
            return;
        console.log(`[req] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
    });
    next();
});
// Routes
app.use('/api/todos', todo_routes_1.default);
app.use('/api/test', test_routes_1.default);
// Health check
app.get('/health', async (req, res) => {
    const todoService = (await Promise.resolve().then(() => __importStar(require('./services/todo.service')))).default;
    try {
        const result = await todoService.healthCheck();
        const statusCode = result.db ? 200 : 503;
        // Add diagnostic headers (non-sensitive)
        res.setHeader('X-Storage-Mode', result.storage || 'unknown');
        res.setHeader('X-DB-Fallback', String(result.fallbackActivated || false));
        if (result.lastError)
            res.setHeader('X-Last-Db-Error', encodeURIComponent(result.lastError.slice(0, 120)));
        if (process.env.DEBUG_HEALTH === '1') {
            // Expose which connection env was detected (not the value)
            res.setHeader('X-Conn-Env', process.env.POSTGRES_URL ? 'POSTGRES_URL' : (process.env.DATABASE_URL ? 'DATABASE_URL' : 'none'));
        }
        res.status(statusCode).json({
            status: result.db ? 'ok' : 'degraded',
            db: result.db,
            storage: result.storage,
            fallbackActivated: result.fallbackActivated,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});
// Basic diagnostic endpoint (no sensitive data, serverless debugging)
app.get('/diag', (req, res) => {
    res.json({
        status: 'diag-ok',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            VERCEL: !!process.env.VERCEL,
            hasPostgresUrl: !!process.env.POSTGRES_URL,
            hasDatabaseUrl: !!process.env.DATABASE_URL
        },
        timestamp: new Date().toISOString()
    });
});
// Fallback route for SPA
app.get('*', (req, res) => {
    // Don't serve index.html for API routes or explicit extensions
    if (req.path.startsWith('/api/') || path_1.default.extname(req.path)) {
        res.status(404).json({ message: 'API endpoint not found' });
        return;
    }
    res.sendFile(path_1.default.join(__dirname, '..', 'public', 'index.html'));
});
// Error handling middleware
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
// Start server
const port = config_1.default.port;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${config_1.default.nodeEnv}`);
});
exports.default = app;
//# sourceMappingURL=server.js.map