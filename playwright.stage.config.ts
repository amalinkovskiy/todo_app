import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '.env.stage') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const stageBaseUrl = process.env.STAGE_BASE_URL;
const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

if (!stageBaseUrl) {
  throw new Error('STAGE_BASE_URL is required to run stage tests. Example: STAGE_BASE_URL=https://your-stage-url.vercel.app npm run test:stage');
}

const extraHTTPHeaders: Record<string, string> = {
  'X-Test-Source': 'stage-smoke',
};

if (vercelBypassSecret) {
  extraHTTPHeaders['x-vercel-protection-bypass'] = vercelBypassSecret;
  extraHTTPHeaders['x-vercel-set-bypass-cookie'] = 'true';
}

export default defineConfig({
  testDir: './tests/stage',
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: false,
  forbidOnly: true,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-stage', open: 'never' }],
    ['json', { outputFile: 'playwright-report-stage/results.json' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: stageBaseUrl,
    trace: 'on-first-retry',
    extraHTTPHeaders,
  },
});
