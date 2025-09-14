/**
 * Глобальная очистка для Playwright MCP тестов
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface TestResult {
  status: 'passed' | 'failed' | 'skipped';
}

interface Test {
  results?: TestResult[];
}

interface Spec {
  tests?: Test[];
}

interface Suite {
  specs?: Spec[];
}

interface PlaywrightResults {
  suites?: Suite[];
  stats?: {
    duration: number;
  };
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('🧹 Глобальная очистка после MCP тестов...');
  
  // Генерируем сводный отчет
  console.log('📊 Генерация сводного отчета...');
  
  const reportPath = path.join(process.cwd(), 'playwright-report', 'results.json');
  
  if (fs.existsSync(reportPath)) {
    try {
      const results: PlaywrightResults = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      
      const summary: TestSummary = {
        total: results.suites?.reduce((acc, suite) => 
          acc + (suite.specs?.length || 0), 0) || 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: results.stats?.duration || 0
      };
      
      // Подсчет результатов
      results.suites?.forEach(suite => {
        suite.specs?.forEach(spec => {
          spec.tests?.forEach(test => {
            if (test.results?.[0]?.status === 'passed') summary.passed++;
            else if (test.results?.[0]?.status === 'failed') summary.failed++;
            else summary.skipped++;
          });
        });
      });
      
      console.log('📈 Сводка тестов:');
      console.log(`   Всего: ${summary.total}`);
      console.log(`   ✅ Прошли: ${summary.passed}`);
      console.log(`   ❌ Упали: ${summary.failed}`);
      console.log(`   ⏭️  Пропущены: ${summary.skipped}`);
      console.log(`   ⏱️  Время: ${Math.round(summary.duration / 1000)}с`);
      
      // Сохраняем сводку
      const summaryPath = path.join(process.cwd(), 'playwright-report', 'summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
    } catch (error) {
      console.log('⚠️  Ошибка при обработке отчета:', (error as Error).message);
    }
  }
  
  console.log('✅ Глобальная очистка завершена');
}

export default globalTeardown;