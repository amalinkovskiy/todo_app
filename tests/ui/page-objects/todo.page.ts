// Page Object for the Simple TODO App UI
// Encapsulates selectors and common user interactions

import { Page, Locator } from '@playwright/test';

export class TodoPage {
  page: Page;
  title: Locator;
  input: Locator;
  addButton: Locator;
  todosList: Locator;
  emptyState: Locator;
  deleteModal: Locator;
  modalTaskName: Locator;
  confirmDeleteBtn: Locator;
  cancelDeleteBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // Top-level elements
    this.title = page.locator('h1');
    this.input = page.locator('#todoInput');
    this.addButton = page.locator('#addBtn');
    this.todosList = page.locator('#todosList');
    this.emptyState = page.locator('.empty-state');

    // Modal elements
    this.deleteModal = page.locator('#deleteModal');
    this.modalTaskName = page.locator('#modalTaskName');
    this.confirmDeleteBtn = page.locator('#confirmDelete');
    this.cancelDeleteBtn = page.locator('#cancelDelete');
  }

  // Navigation & readiness
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async waitForReady(): Promise<void> {
    await this.addButton.waitFor();
    await this.page.waitForLoadState('networkidle');
  }

  // Locators for todo items
  todoItems(): Locator {
    return this.page.locator('.todo-item');
  }

  todoItem(index: number): Locator {
    return this.todoItems().nth(index);
  }

  todoText(item: Locator): Locator {
    return item.locator('.todo-text');
  }

  checkbox(item: Locator): Locator {
    return item.locator('input[type="checkbox"], .todo-checkbox');
  }

  editButton(item: Locator): Locator {
    return item.locator('.edit-btn');
  }

  deleteButton(item: Locator): Locator {
    return item.locator('.delete-btn');
  }

  editInput(): Locator {
    return this.page.locator('.edit-input');
  }

  saveButton(item: Locator): Locator {
    return item.locator('.save-btn');
  }

  cancelButton(item: Locator): Locator {
    return item.locator('.cancel-btn');
  }

  // Actions
  async addTodo(text: string): Promise<void> {
    await this.input.fill(text);
    await this.addButton.click();
  }

  async addTodoWithEnter(text: string): Promise<void> {
    await this.input.fill(text);
    await this.input.press('Enter');
  }

  async clickAddButton(): Promise<void> {
    await this.addButton.click();
  }

  async toggleTodoByIndex(index: number): Promise<void> {
    const item = this.todoItem(index);
    await this.checkbox(item).click();
  }

  async startEditByIndex(index: number): Promise<void> {
    const item = this.todoItem(index);
    await this.editButton(item).click();
  }

  async saveEditByIndex(index: number, newText: string): Promise<void> {
    const item = this.todoItem(index);
    const input = this.editInput();
    await input.fill(newText);
    await this.saveButton(item).click();
  }

  async cancelEditWithEscape(): Promise<void> {
    const input = this.editInput();
    await input.press('Escape');
  }

  async openDeleteModalByIndex(index: number): Promise<void> {
    const item = this.todoItem(index);
    await this.deleteButton(item).click();
  }

  async confirmDelete(): Promise<void> {
    await this.confirmDeleteBtn.click();
  }

  async cancelDelete(): Promise<void> {
    await this.cancelDeleteBtn.click();
  }

  async clickOutsideModal(): Promise<void> {
    // Click near the top-left of the modal overlay
    await this.deleteModal.click({ position: { x: 10, y: 10 } });
  }

  // Wait helpers
  async waitForTodoCount(expected: number): Promise<void> {
    // Wait for the todo list to have the expected count with better error handling
    await this.page.waitForFunction(
      (count) => {
        const items = document.querySelectorAll('.todo-item');
        console.log(`Current todo count: ${items.length}, expected: ${count}`);
        return items.length === count;
      },
      expected,
      { timeout: 10000, polling: 100 }
    );
  }

  async waitForFirstItemCompleted(): Promise<void> {
    await this.page.waitForFunction(() => {
      const firstItem = document.querySelector('.todo-item');
      return firstItem && firstItem.classList.contains('completed');
    }, { timeout: 5000 });
  }
}