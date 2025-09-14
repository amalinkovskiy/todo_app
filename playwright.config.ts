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
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/results.json' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: `http://localhost:${process.env.PORT || 3000}`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'API Tests',
      testMatch: /tests\/api\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${process.env.PORT || 3000}`,
      },
    },
    {
      name: 'UI Tests',
      testMatch: /tests\/ui\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${process.env.PORT || 3000}`,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // Use ts-node to run TypeScript server directly during tests
    command: 'npx ts-node src/server.ts',
    url: `http://localhost:${process.env.PORT || 3000}`,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '3000'
    },
    timeout: 120 * 1000,
  },
});