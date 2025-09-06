import { test, expect } from '@playwright/test';
import { TodoPage } from './page-objects/todo.page.js';

test.describe('TODO Application Responsive Tests', () => {
  const runId = Date.now();
  
  test.beforeEach(async () => {
    // No destructive cleanup in production
  });
  
  test('should work on mobile viewport', async ({ page }) => {
    // Устанавливаем мобильный viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.waitForReady();
    
    // Проверяем, что приложение загружается на мобильном
    await expect(todoPage.input).toBeVisible();
    await expect(todoPage.addButton).toBeVisible();
    
    // Добавляем задачу на мобильном
  const todoText = `Мобильная задача ${runId}`;
    await todoPage.addTodo(todoText);
    
    // Проверяем, что задача отображается корректно
    const todoItem = todoPage.todoItems().first();
    await expect(todoItem).toBeVisible();
    await expect(todoPage.todoText(todoItem)).toContainText(todoText);
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Устанавливаем планшетный viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.waitForReady();
    
    // Добавляем несколько задач для проверки отображения
  const todos = ['Планшет задача 1', 'Планшет задача 2'].map(t => `${t} ${runId}`);
    
    for (const todo of todos) {
      await todoPage.addTodo(todo);
      await todoPage.todoItems().first().waitFor({ timeout: 5000 });
    }
    
    // Ждем немного для стабилизации DOM
    await page.waitForTimeout(500);
    
    // Проверяем корректное отображение списка
    const todoItems = todoPage.todoItems();
    await expect(todoItems).toHaveCount(2);
  });

  test('should work on desktop viewport', async ({ page }) => {
    // Устанавливаем десктопный viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.waitForReady();
    
    // Проверяем, что все элементы видны и доступны
    await expect(page.locator('.container')).toBeVisible();
    await expect(todoPage.title).toContainText('TODO List');
    
    // Тестируем функциональность на большом экране
  await todoPage.addTodo(`Десктопная задача ${runId}`);
    
    const todoItem = todoPage.todoItems().first();
    await expect(todoItem).toBeVisible();
    
    // Тестируем модальное окно на десктопе
    await todoPage.openDeleteModalByIndex(0);
    await expect(todoPage.deleteModal).toBeVisible();
    await todoPage.cancelDelete();
  });
});
