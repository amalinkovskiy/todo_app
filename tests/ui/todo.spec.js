import { test, expect } from '@playwright/test';

test.describe('TODO Application UI Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Очищаем базу данных перед каждым тестом
    await page.request.delete('/api/todos/clear-all');
    
    // Переходим на главную страницу приложения
    await page.goto('/');
    // Ждем загрузки приложения
    await page.waitForSelector('#addBtn');
  });

  test('should display the application title', async ({ page }) => {
    // Проверяем заголовок страницы
    await expect(page.locator('h1')).toContainText('TODO List');
    await expect(page).toHaveTitle('Simple TODO App');
  });

  test('should display empty todo list initially', async ({ page }) => {
    // Проверяем, что изначально нет задач
    await expect(page.locator('.todo-item')).toHaveCount(0);
    
    // Проверяем, что контейнер для задач существует
    await expect(page.locator('#todosList')).toBeVisible();
  });

  test('should add a new todo', async ({ page }) => {
    const todoText = 'Купить молоко';
    
    // Вводим текст новой задачи
    await page.fill('#todoInput', todoText);
    
    // Нажимаем кнопку добавления
    await page.click('#addBtn');
    
    // Ждем появления задачи
    await page.waitForSelector('.todo-item');
    
    // Проверяем, что задача появилась в списке
    const todoItems = page.locator('.todo-item');
    await expect(todoItems).toHaveCount(1);
    await expect(todoItems.first().locator('.todo-text')).toContainText(todoText);
    
    // Проверяем, что поле ввода очистилось
    await expect(page.locator('#todoInput')).toHaveValue('');
  });

  test('should add todo with Enter key', async ({ page }) => {
    const todoText = 'Сделать зарядку';
    
    // Вводим текст и нажимаем Enter
    await page.fill('#todoInput', todoText);
    await page.press('#todoInput', 'Enter');
    
    // Ждем появления задачи
    await page.waitForSelector('.todo-item');
    
    // Проверяем, что задача добавилась
    const todoItems = page.locator('.todo-item');
    await expect(todoItems).toHaveCount(1);
    await expect(todoItems.first().locator('.todo-text')).toContainText(todoText);
  });

  test('should not add empty todo', async ({ page }) => {
    // Пытаемся добавить пустую задачу
    await page.click('#addBtn');
    
    // Ждем немного
    await page.waitForTimeout(500);
    
    // Проверяем, что список остался пустым
    await expect(page.locator('.todo-item')).toHaveCount(0);
  });

  test('should toggle todo completion', async ({ page }) => {
    const todoText = 'Прочитать книгу';
    
    // Добавляем задачу
    await page.fill('#todoInput', todoText);
    await page.click('#addBtn');
    
    const todoItem = page.locator('.todo-item').first();
    const checkbox = todoItem.locator('input[type="checkbox"]');
    
    // Проверяем, что задача не выполнена
    await expect(checkbox).not.toBeChecked();
    await expect(todoItem).not.toHaveClass(/completed/);
    
    // Отмечаем задачу как выполненную
    await checkbox.click();
    
    // Проверяем, что задача отмечена как выполненная
    await expect(checkbox).toBeChecked();
    await expect(todoItem).toHaveClass(/completed/);
    
    // Снимаем отметку
    await checkbox.click();
    
    // Проверяем, что задача снова не выполнена
    await expect(checkbox).not.toBeChecked();
    await expect(todoItem).not.toHaveClass(/completed/);
  });

  test('should edit todo text', async ({ page }) => {
    const originalText = 'Оригинальная задача';
    const editedText = 'Отредактированная задача';
    
    // Добавляем задачу
    await page.fill('#todoInput', originalText);
    await page.click('#addBtn');
    
    const todoItem = page.locator('.todo-item').first();
    
    // Дважды кликаем для редактирования
    await todoItem.locator('.todo-text').dblclick();
    
    // Проверяем, что появилось поле редактирования
    const editInput = todoItem.locator('.edit-input');
    await expect(editInput).toBeVisible();
    await expect(editInput).toHaveValue(originalText);
    
    // Редактируем текст
    await editInput.fill(editedText);
    await editInput.press('Enter');
    
    // Проверяем, что текст изменился
    await expect(todoItem.locator('.todo-text')).toContainText(editedText);
    await expect(editInput).not.toBeVisible();
  });

  test('should cancel edit with Escape', async ({ page }) => {
    const originalText = 'Неизменная задача';
    const tempText = 'Временный текст';
    
    // Добавляем задачу
    await page.fill('#todoInput', originalText);
    await page.click('#addBtn');
    
    const todoItem = page.locator('.todo-item').first();
    
    // Начинаем редактирование
    await todoItem.locator('.todo-text').dblclick();
    const editInput = todoItem.locator('.edit-input');
    
    // Изменяем текст, но нажимаем Escape
    await editInput.fill(tempText);
    await editInput.press('Escape');
    
    // Проверяем, что текст остался оригинальным
    await expect(todoItem.locator('.todo-text')).toContainText(originalText);
    await expect(editInput).not.toBeVisible();
  });

  test('should delete todo with confirmation modal', async ({ page }) => {
    const todoText = 'Задача для удаления';
    
    // Добавляем задачу
    await page.fill('#todoInput', todoText);
    await page.click('#addBtn');
    
    const todoItem = page.locator('.todo-item').first();
    
    // Нажимаем кнопку удаления
    await todoItem.locator('.delete-btn').click();
    
    // Проверяем, что появилось модальное окно подтверждения
    const modal = page.locator('#deleteModal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('#modalTaskName')).toContainText(todoText);
    
    // Подтверждаем удаление
    await page.click('#confirmDelete');
    
    // Проверяем, что задача удалена
    await expect(todoItem).not.toBeVisible();
    await expect(modal).not.toBeVisible();
    await expect(page.locator('.empty-message')).toBeVisible();
  });

  test('should cancel todo deletion', async ({ page }) => {
    const todoText = 'Задача остается';
    
    // Добавляем задачу
    await page.fill('#todoInput', todoText);
    await page.click('#addBtn');
    
    const todoItem = page.locator('.todo-item').first();
    
    // Нажимаем кнопку удаления
    await todoItem.locator('.delete-btn').click();
    
    // Проверяем модальное окно и отменяем
    const modal = page.locator('#deleteModal');
    await expect(modal).toBeVisible();
    await page.click('#cancelDelete');
    
    // Проверяем, что задача осталась
    await expect(todoItem).toBeVisible();
    await expect(modal).not.toBeVisible();
    await expect(todoItem.locator('.todo-text')).toContainText(todoText);
  });

  test('should close modal by clicking outside', async ({ page }) => {
    const todoText = 'Тестовая задача';
    
    // Добавляем задачу
    await page.fill('#todoInput', todoText);
    await page.click('#addBtn');
    
    // Открываем модальное окно удаления
    await page.locator('.todo-item').first().locator('.delete-btn').click();
    
    const modal = page.locator('#deleteModal');
    await expect(modal).toBeVisible();
    
    // Кликаем вне модального окна
    await modal.click({ position: { x: 10, y: 10 } });
    
    // Проверяем, что модальное окно закрылось
    await expect(modal).not.toBeVisible();
    await expect(page.locator('.todo-item')).toBeVisible();
  });

  test('should handle multiple todos', async ({ page }) => {
    const todos = ['Первая задача', 'Вторая задача', 'Третья задача'];
    
    // Добавляем несколько задач
    for (const todo of todos) {
      await page.fill('#todoInput', todo);
      await page.click('#addBtn');
    }
    
    // Проверяем, что все задачи добавлены
    const todoItems = page.locator('.todo-item');
    await expect(todoItems).toHaveCount(todos.length);
    
    // Проверяем текст каждой задачи
    for (let i = 0; i < todos.length; i++) {
      await expect(todoItems.nth(i).locator('.todo-text')).toContainText(todos[i]);
    }
    
    // Отмечаем первую задачу как выполненную
    await todoItems.first().locator('input[type="checkbox"]').click();
    await expect(todoItems.first()).toHaveClass(/completed/);
    
    // Удаляем вторую задачу
    await todoItems.nth(1).locator('.delete-btn').click();
    await page.click('#confirmDelete');
    
    // Проверяем, что осталось 2 задачи
    await expect(todoItems).toHaveCount(2);
  });
});
