import { defineConfig, devices } from '@playwright/test';

/**
 * Live Production test configuration
 * Tests against actual Vercel deployment
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
    baseURL: 'https://exprimental.vercel.app',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'Live Production API Tests',
      testMatch: /tests\/api\/todos-production\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://exprimental.vercel.app',
      },
    },
    {
      name: 'Live Production UI Tests',
      testMatch: /tests\/ui\/.*\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://exprimental.vercel.app',
        trace: 'retain-on-failure',
        video: 'retain-on-failure'
      },
    },
  ],

  // No webServer needed - testing against live deployment
});