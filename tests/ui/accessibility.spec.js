import { test, expect } from '@playwright/test';
import { TodoPage } from './page-objects/todo.page.js';

test.describe('TODO Application Accessibility Tests', () => {
  
  test.beforeEach(async ({ page, request }) => {
    // Очищаем данные перед каждым тестом
    await request.delete('/api/test/clear');
    const todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('should have proper heading structure', async ({ page }) => {
    const todoPage = new TodoPage(page);
    // Проверяем наличие главного заголовка
    await expect(todoPage.title).toBeVisible();
    await expect(todoPage.title).toContainText('TODO List');
  });

  test('should have accessible form elements', async ({ page }) => {
    const todoPage = new TodoPage(page);
    // Проверяем label для поля ввода
    await expect(todoPage.input).toHaveAttribute('placeholder', 'Введите новую задачу...');
    
    // Проверяем кнопку добавления
    await expect(todoPage.addButton).toBeVisible();
    await expect(todoPage.addButton).toContainText('Добавить');
  });

  test('should support keyboard navigation', async ({ page }) => {
    const todoPage = new TodoPage(page);
    // Проверяем навигацию с клавиатуры
    await page.keyboard.press('Tab');
    await expect(todoPage.input).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(todoPage.addButton).toBeFocused();
    
    // Добавляем задачу с клавиатуры
    await todoPage.input.focus();
    await todoPage.input.type('Клавиатурная задача');
    await page.keyboard.press('Enter');
    
    // Проверяем, что задача добавилась
    const todoItem = todoPage.todoItems().first();
    await expect(todoItem).toBeVisible();
  });

  test('should have accessible buttons with proper labels', async ({ page }) => {
    const todoPage = new TodoPage(page);
    // Добавляем задачу для тестирования кнопок
    await todoPage.addTodo('Тестовая задача');
    
    const todoItem = todoPage.todoItems().first();
    
    // Проверяем кнопку удаления
    const deleteBtn = todoItem.locator('.delete-btn');
    await expect(deleteBtn).toBeVisible();
    await expect(deleteBtn).toContainText('Удалить');
    
    // Проверяем чекбокс
    const checkbox = todoItem.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible();
  });

  test('should announce state changes for screen readers', async ({ page }) => {
    const todoPage = new TodoPage(page);
    // Добавляем задачу
    await todoPage.addTodo('Задача для скрин ридера');
    
    const todoItem = todoPage.todoItems().first();
    const checkbox = todoPage.checkbox(todoItem);
    
    // Проверяем, что статус чекбокса меняется
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await todoPage.waitForFirstItemCompleted();
    
    // Проверяем класс completed
    await expect(todoItem).toHaveClass(/completed/);
  });

  test('should have proper color contrast', async ({ page }) => {
    const todoPage = new TodoPage(page);
    // Добавляем задачу для проверки стилей
    await todoPage.addTodo('Контрастная задача');
    
    const todoItem = todoPage.todoItems().first();
    
    // Проверяем, что элементы видимы (базовая проверка контрастности)
    await expect(todoPage.todoText(todoItem)).toBeVisible();
    await expect(todoItem.locator('.delete-btn')).toBeVisible();
    
    // Отмечаем как выполненную и проверяем видимость
    await todoPage.checkbox(todoItem).click();
    await expect(todoPage.todoText(todoItem)).toBeVisible();
  });

  test('should support Escape key for modal closing', async ({ page }) => {
    const todoPage = new TodoPage(page);
    // Добавляем задачу
    await todoPage.addTodo('Задача для Escape');
    
    // Открываем модальное окно - используем first() для первой кнопки
    await todoPage.openDeleteModalByIndex(0);
    await expect(todoPage.deleteModal).toBeVisible();
    
    // Закрываем с помощью Escape
    await page.keyboard.press('Escape');
    await expect(todoPage.deleteModal).not.toBeVisible();
  });

  test('should maintain focus management in modal', async ({ page }) => {
    const todoPage = new TodoPage(page);
    // Добавляем задачу
    await todoPage.addTodo('Фокус тест');
    
    // Открываем модальное окно - используем first() для первой кнопки
    await todoPage.openDeleteModalByIndex(0);
    await expect(todoPage.deleteModal).toBeVisible();
    
    // Проверяем, что кнопки в модальном окне доступны для фокуса
    await page.keyboard.press('Tab');
    const confirmBtn = page.locator('#confirmDelete');
    const cancelBtn = page.locator('#cancelDelete');
    
    // Один из элементов должен получить фокус
    const focusedElement = await page.evaluate(() => document.activeElement?.id);
    expect(['confirmDelete', 'cancelDelete']).toContain(focusedElement);
  });
});
