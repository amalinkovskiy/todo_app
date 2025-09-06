#!/usr/bin/env node
/**
 * Starts the server in production-like mode for Playwright production API tests.
 * Loads variables from .env.prod-test (which contains PORT/POSTGRES_URL) before launching server.
 */
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env.prod-test if present
const prodTestEnvPath = path.resolve(process.cwd(), '.env.prod-test');
if (fs.existsSync(prodTestEnvPath)) {
  dotenv.config({ path: prodTestEnvPath });
  console.log(`[start-prod-test] Loaded environment from .env.prod-test`);
} else {
  console.warn(`[start-prod-test] .env.prod-test not found, relying on existing env vars.`);
}

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3001';

if (!process.env.POSTGRES_URL) {
  console.error('[start-prod-test] POSTGRES_URL not set. Add it to .env.prod-test or environment.');
  process.exit(1);
}

const serverPath = path.resolve('src', 'server.js');
console.log(`[start-prod-test] Starting server: node ${serverPath}`);

const child = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', code => {
  console.log(`[start-prod-test] Server process exited with code ${code}`);
  process.exit(code || 0);
});
