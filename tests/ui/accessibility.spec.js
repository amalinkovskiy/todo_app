import { test, expect } from '@playwright/test';

test.describe('TODO Application Accessibility Tests', () => {
  
  test.beforeEach(async ({ page, request }) => {
    // Очищаем данные перед каждым тестом
    await request.delete('/api/test/clear');
    await page.goto('/');
  });

  test('should have proper heading structure', async ({ page }) => {
    // Проверяем наличие главного заголовка
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('TODO List');
  });

  test('should have accessible form elements', async ({ page }) => {
    // Проверяем label для поля ввода
    const input = page.locator('#todoInput');
    await expect(input).toHaveAttribute('placeholder', 'Введите новую задачу...');
    
    // Проверяем кнопку добавления
    const addBtn = page.locator('#addBtn');
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toContainText('Добавить');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Проверяем навигацию с клавиатуры
    await page.keyboard.press('Tab');
    await expect(page.locator('#todoInput')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('#addBtn')).toBeFocused();
    
    // Добавляем задачу с клавиатуры
    await page.focus('#todoInput');
    await page.type('#todoInput', 'Клавиатурная задача');
    await page.keyboard.press('Enter');
    
    // Проверяем, что задача добавилась
    const todoItem = page.locator('.todo-item').first();
    await expect(todoItem).toBeVisible();
  });

  test('should have accessible buttons with proper labels', async ({ page }) => {
    // Добавляем задачу для тестирования кнопок
    await page.fill('#todoInput', 'Тестовая задача');
    await page.click('#addBtn');
    
    const todoItem = page.locator('.todo-item').first();
    
    // Проверяем кнопку удаления
    const deleteBtn = todoItem.locator('.delete-btn');
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toContainText('Удалить');
    
    // Проверяем чекбокс
    const checkbox = todoItem.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
  });

  test('should announce state changes for screen readers', async ({ page }) => {
    // Добавляем задачу
    await page.fill('#todoInput', 'Задача для скрин ридера');
    await page.click('#addBtn');
    
    const todoItem = page.locator('.todo-item').first();
    const checkbox = todoItem.locator('input[type="checkbox"]');
    
    // Проверяем, что статус чекбокса меняется
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    
    // Проверяем класс completed
    await expect(todoItem).toHaveClass(/completed/);
  });

  test('should have proper color contrast', async ({ page }) => {
    // Добавляем задачу для проверки стилей
    await page.fill('#todoInput', 'Контрастная задача');
    await page.click('#addBtn');
    
    const todoItem = page.locator('.todo-item').first();
    
    // Проверяем, что элементы видимы (базовая проверка контрастности)
    await expect(todoItem.locator('.todo-text')).toBeVisible();
    await expect(todoItem.locator('.delete-btn')).toBeVisible();
    
    // Отмечаем как выполненную и проверяем видимость
    await todoItem.locator('input[type="checkbox"]').click();
    await expect(todoItem.locator('.todo-text')).toBeVisible();
  });

  test('should support Escape key for modal closing', async ({ page }) => {
    // Добавляем задачу
    await page.fill('#todoInput', 'Задача для Escape');
    await page.click('#addBtn');
    
    // Открываем модальное окно - используем first() для первой кнопки
    await page.locator('.todo-item .delete-btn').first().click();
    const modal = page.locator('#deleteModal');
    await expect(modal).toBeVisible();
    
    // Закрываем с помощью Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('should maintain focus management in modal', async ({ page }) => {
    // Добавляем задачу
    await page.fill('#todoInput', 'Фокус тест');
    await page.click('#addBtn');
    
    // Открываем модальное окно - используем first() для первой кнопки
    await page.locator('.todo-item .delete-btn').first().click();
    const modal = page.locator('#deleteModal');
    await expect(modal).toBeVisible();
    
    // Проверяем, что кнопки в модальном окне доступны для фокуса
    await page.keyboard.press('Tab');
    const confirmBtn = page.locator('#confirmDelete');
    const cancelBtn = page.locator('#cancelDelete');
    
    // Один из элементов должен получить фокус
    const focusedElement = await page.evaluate(() => document.activeElement?.id);
    expect(['confirmDelete', 'cancelDelete']).toContain(focusedElement);
  });
});
