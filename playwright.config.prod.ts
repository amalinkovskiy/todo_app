import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Read from default ".env" file.
dotenv.config();

// Read from ".env.local" file.
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Read from ".env.test" file for test-specific variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Production test configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/results.json' }]
  ],
  use: {
    baseURL: `http://localhost:3001`,
    trace: 'on-first-retry',
  },
  // Automatically start production-like server for tests using helper script
  webServer: {
    command: 'npx ts-node scripts/start-prod-test.ts',
    url: 'http://localhost:3001/health',
    reuseExistingServer: true,
    timeout: 30_000,
  },

  projects: [
    {
      name: 'API Tests - Production',
      testMatch: /tests\/api\/todos-production\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:3001`,
      },
    },
  ],

  // webServer now handled above
});