import { test, expect } from '@playwright/test';
import { TodoApiHelper } from '../helpers/api-helpers.js';
import { TodoPage } from './page-objects/todo.page.js';

test.describe('TODO Application UI Tests', () => {
  let apiHelper;
  let todoPage;
  
  test.beforeEach(async ({ page, request }) => {
    // Инициализируем API helper для подготовки данных
    apiHelper = new TodoApiHelper(request);
    
    // Очищаем базу данных перед каждым тестом
    await apiHelper.clearAllTodos();
    
  // Инициализируем Page Object и подготавливаем UI
  todoPage = new TodoPage(page);
  await todoPage.goto();
  await todoPage.waitForReady();
  });

  test('should display the application title', async ({ page }) => {
    // Проверяем заголовок страницы
  await expect(todoPage.title).toContainText('TODO List');
  await expect(page).toHaveTitle('Simple TODO App');
  });

  test('should display empty todo list initially', async ({ page }) => {
    // Проверяем, что изначально нет задач
  await expect(todoPage.todoItems()).toHaveCount(0);
  // Проверяем, что контейнер для задач существует
  await expect(todoPage.todosList).toBeVisible();
  });

  test('should add a new todo', async ({ page }) => {
    const todoText = 'Купить молоко';
    
  // Добавляем задачу через Page Object
  await todoPage.addTodo(todoText);
  await todoPage.todoItems().first().waitFor();
    
  // Проверяем, что задача появилась в списке
  const todoItems = todoPage.todoItems();
  await expect(todoItems).toHaveCount(1);
  await expect(todoPage.todoText(todoItems.first())).toContainText(todoText);
    
  // Проверяем, что поле ввода очистилось
  await expect(todoPage.input).toHaveValue('');
  });

  test('should add todo with Enter key', async ({ page }) => {
    const todoText = 'Сделать зарядку';
    
    // Вводим текст и нажимаем Enter
  await todoPage.addTodoWithEnter(todoText);
  await todoPage.todoItems().first().waitFor();
    
  const todoItems = todoPage.todoItems();
  await expect(todoItems).toHaveCount(1);
  await expect(todoPage.todoText(todoItems.first())).toContainText(todoText);
  });

  test('should not add empty todo', async ({ page }) => {
    // Пытаемся добавить пустую задачу
  await todoPage.clickAddButton();
  await page.waitForTimeout(500);
  await expect(todoPage.todoItems()).toHaveCount(0);
  });

  test('should toggle todo completion', async ({ page }) => {
    const todoText = 'Прочитать книгу';
    
    // Добавляем задачу
  await todoPage.addTodo(todoText);
  await todoPage.todoItems().first().waitFor();
    
  const todoItem = todoPage.todoItems().first();
  const checkbox = todoPage.checkbox(todoItem);
    
  await expect(checkbox).not.toBeChecked();
  await expect(todoItem).not.toHaveClass(/completed/);
    
  await checkbox.click();
  await page.waitForTimeout(1000);
  await expect(checkbox).toBeChecked();
  await todoPage.waitForFirstItemCompleted();
  await expect(todoItem).toHaveClass(/completed/);
    
  await checkbox.click();
  await page.waitForTimeout(1000);
  await expect(checkbox).not.toBeChecked();
  await expect(todoItem).not.toHaveClass(/completed/);
  });

  test('should edit todo text', async ({ page }) => {
    const originalText = 'Оригинальная задача';
    const editedText = 'Отредактированная задача';
    
    // Добавляем задачу
  await todoPage.addTodo(originalText);
  await todoPage.todoItems().first().waitFor();
  const todoItem = todoPage.todoItems().first();
    
  await todoPage.startEditByIndex(0);
  const editInput = todoPage.editInput();
  await expect(editInput).toBeVisible();
  await expect(editInput).toHaveValue(originalText);
    
  await editInput.fill(editedText);
  await todoPage.saveEditByIndex(0, editedText);
  await page.waitForTimeout(500);
    
  await expect(todoPage.todoText(todoItem)).toContainText(editedText);
  await expect(editInput).not.toBeVisible();
  });

  test('should cancel edit with Escape', async ({ page }) => {
    const originalText = 'Неизменная задача';
    const tempText = 'Временный текст';
    
    // Добавляем задачу
  await todoPage.addTodo(originalText);
  await todoPage.todoItems().first().waitFor();
  const todoItem = todoPage.todoItems().first();
    
  await todoPage.startEditByIndex(0);
  const editInput = todoPage.editInput();
  await expect(editInput).toBeVisible();
    
  await editInput.fill(tempText);
  await todoPage.cancelEditWithEscape();
  await page.waitForTimeout(500);
    
  await expect(todoPage.todoText(todoItem)).toContainText(originalText);
  await expect(editInput).not.toBeVisible();
  });

  test('should delete todo with confirmation modal', async ({ page }) => {
    const todoText = 'Задача для удаления';
    
    // Добавляем задачу
  await todoPage.addTodo(todoText);
  const todoItem = todoPage.todoItems().first();
  await todoPage.openDeleteModalByIndex(0);
    
  await expect(todoPage.deleteModal).toBeVisible();
  await expect(todoPage.modalTaskName).toContainText(todoText);
    
  await todoPage.confirmDelete();
  await expect(todoPage.deleteModal).not.toBeVisible();
    
  await todoPage.waitForTodoCount(0);
  await expect(todoPage.todoItems()).toHaveCount(0);
  await expect(todoPage.emptyState).toBeVisible();
  });

  test('should cancel todo deletion', async ({ page }) => {
    const todoText = 'Задача остается';
    
    // Добавляем задачу
  await todoPage.addTodo(todoText);
  await todoPage.todoItems().first().waitFor();
  const todoItem = todoPage.todoItems().first();
    
  await todoPage.openDeleteModalByIndex(0);
  await expect(todoPage.deleteModal).toBeVisible();
  await todoPage.cancelDelete();
  await expect(todoPage.deleteModal).not.toBeVisible();
    
  await expect(todoItem).toBeVisible();
  await expect(todoPage.todoText(todoItem)).toContainText(todoText);
  });

  test('should close modal by clicking outside', async ({ page }) => {
    const todoText = 'Тестовая задача';
    
    // Добавляем задачу
  await todoPage.addTodo(todoText);
  await todoPage.openDeleteModalByIndex(0);
  await expect(todoPage.deleteModal).toBeVisible();
  await todoPage.clickOutsideModal();
  await expect(todoPage.deleteModal).not.toBeVisible();
  await expect(todoPage.todoItems()).toBeVisible();
  });

  test('should handle multiple todos', async ({ page }) => {
    const todos = ['Первая задача', 'Вторая задача', 'Третья задача'];
    
    // Добавляем несколько задач
    for (const todo of todos) {
      await todoPage.addTodo(todo);
      await page.waitForTimeout(200);
    }
    
    await todoPage.waitForTodoCount(todos.length);
    const todoItems = todoPage.todoItems();
    await expect(todoItems).toHaveCount(todos.length);
    
    for (let i = 0; i < todos.length; i++) {
      await expect(todoPage.todoText(todoItems.nth(i))).toContainText(todos[i]);
    }
    
    await todoPage.toggleTodoByIndex(0);
    await todoPage.waitForFirstItemCompleted();
    await expect(todoItems.first()).toHaveClass(/completed/);
    
    await todoPage.openDeleteModalByIndex(1);
    await todoPage.confirmDelete();
    
    await todoPage.waitForTodoCount(2);
    await expect(todoItems).toHaveCount(2);
  });

  test('should display pre-created todos from API', async ({ page }) => {
    // Создаем задачи через API перед загрузкой страницы
    await apiHelper.createTodo('API созданная задача 1');
    await apiHelper.createTodo('API созданная задача 2', true); // выполненная
    await apiHelper.createTodo('API созданная задача 3');
    
    // Перезагружаем страницу для получения данных с сервера
  await page.reload();
  await todoPage.todoItems().first().waitFor();
    
  const todoItems = todoPage.todoItems();
  await expect(todoItems).toHaveCount(3);
  await expect(todoItems.nth(1)).toHaveClass(/completed/);
  await expect(todoPage.checkbox(todoItems.nth(1))).toBeChecked();
    
  await expect(todoPage.todoText(todoItems.nth(0))).toContainText('API созданная задача 1');
  await expect(todoPage.todoText(todoItems.nth(1))).toContainText('API созданная задача 2');
  await expect(todoPage.todoText(todoItems.nth(2))).toContainText('API созданная задача 3');
  });

  test('should integrate UI actions with API state', async ({ page }) => {
    // Создаем задачу через API
    const apiTodo = await apiHelper.createTodo('Задача из API');
    
    // Перезагружаем страницу
  await page.reload();
  await todoPage.todoItems().first().waitFor();
    
  const todoItem = todoPage.todoItems().first();
  await expect(todoPage.todoText(todoItem)).toContainText('Задача из API');
    
  await todoPage.startEditByIndex(0);
  const editInput = todoPage.editInput();
  await editInput.fill('Измененная через UI задача');
  await todoPage.saveEditByIndex(0, 'Измененная через UI задача');
    
    // Проверяем изменения через API
    const updatedTodo = await apiHelper.getTodoByUuid(apiTodo.uuid);
    expect(updatedTodo.text).toBe('Измененная через UI задача');
    expect(updatedTodo.completed).toBe(false);
    
    // Отмечаем как выполненную через UI
    await todoItem.locator('input[type="checkbox"]').click();
    await page.waitForTimeout(500);
    
    // Проверяем изменения через API
    const completedTodo = await apiHelper.getTodoByUuid(apiTodo.uuid);
    expect(completedTodo.completed).toBe(true);
  });
});
