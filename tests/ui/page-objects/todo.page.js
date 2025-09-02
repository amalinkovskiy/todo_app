// Page Object for the Simple TODO App UI
// Encapsulates selectors and common user interactions

export class TodoPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
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
  async goto() {
    await this.page.goto('/');
  }

  async waitForReady() {
    await this.addButton.waitFor();
    await this.page.waitForLoadState('networkidle');
  }

  // Locators for todo items
  todoItems() {
    return this.page.locator('.todo-item');
  }

  todoItem(index) {
    return this.todoItems().nth(index);
  }

  todoText(item) {
    return item.locator('.todo-text');
  }

  checkbox(item) {
    return item.locator('input[type="checkbox"], .todo-checkbox');
  }

  editButton(item) {
    return item.locator('.edit-btn');
  }

  deleteButton(item) {
    return item.locator('.delete-btn');
  }

  editInput() {
    return this.page.locator('.edit-input');
  }

  saveButton(item) {
    return item.locator('.save-btn');
  }

  cancelButton(item) {
    return item.locator('.cancel-btn');
  }

  // Actions
  async addTodo(text) {
    await this.input.fill(text);
    await this.addButton.click();
  }

  async addTodoWithEnter(text) {
    await this.input.fill(text);
    await this.input.press('Enter');
  }

  async clickAddButton() {
    await this.addButton.click();
  }

  async toggleTodoByIndex(index) {
    const item = this.todoItem(index);
    await this.checkbox(item).click();
  }

  async startEditByIndex(index) {
    const item = this.todoItem(index);
    await this.editButton(item).click();
  }

  async saveEditByIndex(index, newText) {
    const item = this.todoItem(index);
    const input = this.editInput();
    await input.fill(newText);
    await this.saveButton(item).click();
  }

  async cancelEditWithEscape() {
    const input = this.editInput();
    await input.press('Escape');
  }

  async openDeleteModalByIndex(index) {
    const item = this.todoItem(index);
    await this.deleteButton(item).click();
  }

  async confirmDelete() {
    await this.confirmDeleteBtn.click();
  }

  async cancelDelete() {
    await this.cancelDeleteBtn.click();
  }

  async clickOutsideModal() {
    // Click near the top-left of the modal overlay
    await this.deleteModal.click({ position: { x: 10, y: 10 } });
  }

  // Wait helpers
  async waitForTodoCount(expected) {
    await this.page.waitForFunction(
      (count) => document.querySelectorAll('.todo-item').length === count,
      expected,
      { timeout: 5000 }
    );
  }

  async waitForFirstItemCompleted() {
    await this.page.waitForFunction(() => {
      const firstItem = document.querySelector('.todo-item');
      return firstItem && firstItem.classList.contains('completed');
    }, { timeout: 5000 });
  }
}
