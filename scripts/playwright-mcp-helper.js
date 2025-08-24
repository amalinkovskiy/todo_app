#!/usr/bin/env node

/**
 * Playwright MCP Test Generator
 * Помощник для автоматического создания тестов с использованием MCP
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class PlaywrightMCPHelper {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.testDir = path.join(__dirname, '..', 'tests', 'ui');
  }

  /**
   * Запускает MCP сервер для интерактивной генерации тестов
   */
  async startMCPServer() {
    console.log('🚀 Запуск Playwright MCP сервера...');
    
    try {
      // Запускаем MCP сервер
      execSync('npx @playwright/mcp', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
    } catch (error) {
      console.error('❌ Ошибка при запуске MCP сервера:', error.message);
    }
  }

  /**
   * Создает новый тест файл с базовой структурой
   */
  createTestTemplate(testName) {
    const fileName = `${testName.toLowerCase().replace(/\s+/g, '-')}.spec.js`;
    const filePath = path.join(this.testDir, fileName);

    const template = `import { test, expect } from '@playwright/test';

test.describe('${testName} Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Очищаем базу данных перед каждым тестом
    await page.request.delete('/api/test/clear');
    
    // Переходим на главную страницу приложения
    await page.goto('/');
    
    // Ждем загрузки приложения
    await page.waitForSelector('#addBtn');
    
    // Ждем полной загрузки состояния
    await page.waitForLoadState('networkidle');
  });

  test('should load the page', async ({ page }) => {
    // TODO: Добавить тест с помощью MCP
    await expect(page).toHaveTitle(/TODO/);
  });

});
`;

    fs.writeFileSync(filePath, template);
    console.log(`✅ Создан тест файл: ${filePath}`);
    return filePath;
  }

  /**
   * Анализирует существующие тесты и предлагает улучшения
   */
  analyzeExistingTests() {
    const testFiles = fs.readdirSync(this.testDir)
      .filter(file => file.endsWith('.spec.js'))
      .map(file => path.join(this.testDir, file));

    console.log('📊 Анализ существующих тестов:');
    
    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      const testCount = (content.match(/test\(/g) || []).length;
      const describeName = content.match(/test\.describe\('([^']+)'/)?.[1] || 'Без описания';
      
      console.log(`  📄 ${path.basename(file)}: ${testCount} тестов (${describeName})`);
    });

    return testFiles;
  }

  /**
   * Генерирует отчет о покрытии тестами
   */
  generateCoverageReport() {
    console.log('📈 Генерация отчета о покрытии...');
    
    try {
      execSync('npx playwright test --reporter=html', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Отчет сгенерирован! Откройте playwright-report/index.html');
    } catch (error) {
      console.error('❌ Ошибка при генерации отчета:', error.message);
    }
  }

  /**
   * Запускает интерактивный режим создания тестов
   */
  async interactiveMode() {
    console.log(`
🎭 Playwright MCP Helper
========================

Доступные команды:
1. start-mcp    - Запустить MCP сервер
2. create-test  - Создать новый тест
3. analyze      - Анализ существующих тестов  
4. coverage     - Генерация отчета о покрытии
5. help         - Показать эту справку

Для работы с MCP:
- Убедитесь, что приложение запущено на ${this.baseUrl}
- Используйте MCP команды для записи действий пользователя
- Генерируйте тесты на основе записанных действий
`);
  }
}

// CLI интерфейс
if (require.main === module) {
  const helper = new PlaywrightMCPHelper();
  const command = process.argv[2];

  switch (command) {
    case 'start-mcp':
      helper.startMCPServer();
      break;
    case 'create-test':
      const testName = process.argv[3] || 'New Test';
      helper.createTestTemplate(testName);
      break;
    case 'analyze':
      helper.analyzeExistingTests();
      break;
    case 'coverage':
      helper.generateCoverageReport();
      break;
    case 'help':
    default:
      helper.interactiveMode();
      break;
  }
}

module.exports = PlaywrightMCPHelper;
