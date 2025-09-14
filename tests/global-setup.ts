/**
 * Глобальная настройка для Playwright MCP тестов
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🎭 Настройка глобальной среды для MCP тестов...');
  
  // Создаем директории для отчетов если их нет
  const directories = [
    'test-results',
    'test-results/videos', 
    'playwright-report',
    'tests/mcp-generated'
  ];
  
  directories.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Создана директория: ${dir}`);
    }
  });
  
  // Проверяем доступность сервера
  const baseURL = config.projects[0].use?.baseURL || 'http://localhost:3001';
  
  console.log(`🌐 Проверка доступности сервера: ${baseURL}`);
  
  try {
    const response = await fetch(`${baseURL}/api/health`);
    if (response.ok) {
      console.log('✅ Сервер доступен');
      
      // Очищаем все данные перед запуском тестов
      console.log('🧹 Очистка данных перед тестами...');
      try {
        const clearResponse = await fetch(`${baseURL}/api/todos`, {
          method: 'DELETE'
        });
        if (clearResponse.ok) {
          console.log('✅ Данные очищены успешно');
        } else {
          console.log('⚠️  Не удалось очистить данные, но продолжаем тесты');
        }
      } catch (clearError) {
        console.log('⚠️  Ошибка при очистке данных:', clearError);
      }
    } else {
      console.log('⚠️  Сервер отвечает с ошибкой, но продолжаем тесты');
    }
  } catch (error) {
    console.log('⚠️  Сервер недоступен, убедитесь что он запущен');
  }
  
  console.log('🚀 Глобальная настройка завершена');
}

export default globalSetup;