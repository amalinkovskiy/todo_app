import { test, expect } from '@playwright/test';

test.describe('TODO Application Responsive Tests', () => {
  
  test('should work on mobile viewport', async ({ page }) => {
    // Устанавливаем мобильный viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Проверяем, что приложение загружается на мобильном
    await expect(page.locator('#todoInput')).toBeVisible();
    await expect(page.locator('#addBtn')).toBeVisible();
    
    // Добавляем задачу на мобильном
    const todoText = 'Мобильная задача';
    await page.fill('#todoInput', todoText);
    await page.click('#addBtn');
    
    // Проверяем, что задача отображается корректно
    const todoItem = page.locator('.todo-item').first();
    await expect(todoItem).toBeVisible();
    await expect(todoItem.locator('.todo-text')).toContainText(todoText);
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Устанавливаем планшетный viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Добавляем несколько задач для проверки отображения
    const todos = ['Планшет задача 1', 'Планшет задача 2'];
    
    for (const todo of todos) {
      await page.fill('#todoInput', todo);
      await page.click('#addBtn');
    }
    
    // Проверяем корректное отображение списка
    const todoItems = page.locator('.todo-item');
    await expect(todoItems).toHaveCount(2);
  });

  test('should work on desktop viewport', async ({ page }) => {
    // Устанавливаем десктопный viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Проверяем, что все элементы видны и доступны
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Simple TODO App');
    
    // Тестируем функциональность на большом экране
    await page.fill('#todoInput', 'Десктопная задача');
    await page.click('#addBtn');
    
    const todoItem = page.locator('.todo-item').first();
    await expect(todoItem).toBeVisible();
    
    // Тестируем модальное окно на десктопе
    await todoItem.locator('.delete-btn').click();
    const modal = page.locator('#deleteModal');
    await expect(modal).toBeVisible();
    await page.click('#cancelDelete');
  });
});
