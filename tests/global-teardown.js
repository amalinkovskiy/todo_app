/**
 * Глобальная очистка для Playwright MCP тестов
 */

async function globalTeardown(config) {
  console.log('🧹 Глобальная очистка после MCP тестов...');
  
  const fs = require('fs');
  const path = require('path');
  
  // Генерируем сводный отчет
  console.log('📊 Генерация сводного отчета...');
  
  const reportPath = path.join(process.cwd(), 'playwright-report', 'results.json');
  
  if (fs.existsSync(reportPath)) {
    try {
      const results = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      
      const summary = {
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
      console.log('⚠️  Ошибка при обработке отчета:', error.message);
    }
  }
  
  console.log('✅ Глобальная очистка завершена');
}

module.exports = globalTeardown;
