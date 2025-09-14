import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright конфигурация с поддержкой MCP
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/ui',
  
  /* Запускать тесты в файлах параллельно */
  fullyParallel: true,
  
  /* Не разрешать test.only в CI */
  forbidOnly: !!process.env.CI,
  
  /* Повторить только при ошибке в CI */
  retries: process.env.CI ? 2 : 0,
  
  /* Количество workers в CI, иначе половина логических ядер */
  workers: process.env.CI ? 1 : undefined,
  
  /* Репортеры */
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }]
  ],
  
  /* Глобальные настройки для всех проектов */
  use: {
    /* Базовый URL для тестирования */
    baseURL: 'http://localhost:3001',
    
    /* Собирать трассировку при повторном запуске неудачных тестов */
    trace: 'on-first-retry',
    
    /* Скриншоты только при ошибке */
    screenshot: 'only-on-failure',
    
    /* Видео только при ошибке */
    video: 'retain-on-failure',
  },

  /* Настройка проектов для разных браузеров */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Настройки для MCP
        contextOptions: {
          recordVideo: {
            dir: './test-results/videos/',
            size: { width: 1280, height: 720 }
          }
        }
      },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Тесты на мобильных устройствах */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Тесты на планшетах */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  /* Запуск локального dev сервера перед началом тестов */
  webServer: {
    command: 'npm start',
    port: 3001,
    env: {
      NODE_ENV: 'test'
    },
    reuseExistingServer: !process.env.CI,
  },

  /* Глобальные настройки для MCP */
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),
});