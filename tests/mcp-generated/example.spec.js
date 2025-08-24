import { test, expect } from '@playwright/test';

/**
 * MCP Generated Test Example
 * Пример теста, созданного с помощью Playwright MCP
 * 
 * Этот файл показывает как можно использовать MCP для:
 * 1. Записи пользовательских действий
 * 2. Автоматической генерации тестов
 * 3. Создания проверок на основе DOM
 */

test.describe('MCP Generated Tests Example', () => {
  
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

  test('MCP recorded user flow - adding multiple todos', async ({ page }) => {
    // Это пример теста, который можно сгенерировать с MCP
    // на основе записи реальных действий пользователя
    
    // Шаг 1: Добавить первую задачу
    await page.fill('#todoInput', 'Выучить Playwright MCP');
    await page.click('#addBtn');
    
    // Ждем появления задачи
    await page.waitForSelector('.todo-item');
    
    // Шаг 2: Добавить вторую задачу
    await page.fill('#todoInput', 'Автоматизировать тестирование');
    await page.click('#addBtn');
    
    // Шаг 3: Отметить первую задачу как выполненную
    await page.locator('.todo-item').first().locator('input[type="checkbox"]').click();
    
    // Ждем обновления состояния
    await page.waitForFunction(() => {
      const firstItem = document.querySelector('.todo-item');
      return firstItem && firstItem.classList.contains('completed');
    }, { timeout: 5000 });
    
    // Проверки (могут быть автоматически сгенерированы MCP)
    await expect(page.locator('.todo-item')).toHaveCount(2);
    await expect(page.locator('.todo-item').first()).toHaveClass(/completed/);
    await expect(page.locator('.todo-item').last()).not.toHaveClass(/completed/);
    
    // Шаг 4: Редактировать вторую задачу
    await page.locator('.todo-item').last().locator('.edit-btn').click();
    
    const editInput = page.locator('.todo-item').last().locator('.edit-input');
    await expect(editInput).toBeVisible();
    
    await editInput.fill('Автоматизировать тестирование с MCP');
    await page.locator('.todo-item').last().locator('.save-btn').click();
    
    // Проверка обновленного текста
    await expect(page.locator('.todo-item').last().locator('.todo-text'))
      .toContainText('Автоматизировать тестирование с MCP');
  });

  test('MCP generated accessibility test', async ({ page }) => {
    // Пример теста на доступность, который можно сгенерировать с MCP
    
    // Добавляем задачу для тестирования
    await page.fill('#todoInput', 'Проверить доступность');
    await page.click('#addBtn');
    
    // Проверяем keyboard navigation (можно записать с MCP)
    await page.keyboard.press('Tab'); // Переход на checkbox
    await expect(page.locator('.todo-checkbox')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Переход на кнопку редактирования
    await expect(page.locator('.edit-btn')).toBeFocused();
    
    await page.keyboard.press('Tab'); // Переход на кнопку удаления
    await expect(page.locator('.delete-btn')).toBeFocused();
    
    // Проверяем screen reader labels
    await expect(page.locator('.todo-checkbox')).toHaveAttribute('type', 'checkbox');
    await expect(page.locator('.edit-btn')).toContainText('Изменить');
    await expect(page.locator('.delete-btn')).toContainText('Удалить');
  });

  test('MCP recorded error handling flow', async ({ page }) => {
    // Пример теста для проверки обработки ошибок
    
    // Попытка добавить пустую задачу
    await page.click('#addBtn'); // Без ввода текста
    
    // Проверяем, что задача не добавилась
    await expect(page.locator('.todo-item')).toHaveCount(0);
    await expect(page.locator('.empty-state')).toBeVisible();
    
    // Добавляем очень длинную задачу
    const longText = 'А'.repeat(1000);
    await page.fill('#todoInput', longText);
    await page.click('#addBtn');
    
    // Проверяем, что задача добавилась и текст корректно отображается
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await expect(page.locator('.todo-text')).toContainText(longText.substring(0, 50));
  });
});
