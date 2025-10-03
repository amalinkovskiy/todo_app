interface Todo {
  uuid: string;
  text: string;
  completed: boolean;
  created_at: string;
}

class TodoApp {
  private todos: Todo[] = [];
  private editingUuid: string | null = null;
  private deleteUuid: string | null = null;

  private todoInput!: HTMLInputElement;
  private addBtn!: HTMLButtonElement;
  private todosList!: HTMLUListElement;

  // Modal dialog elements
  private deleteModal!: HTMLDivElement;
  private modalTaskName!: HTMLSpanElement;
  private confirmDeleteBtn!: HTMLButtonElement;
  private cancelDeleteBtn!: HTMLButtonElement;

  constructor() {
    this.initElements();
    this.bindEvents();
    this.loadTodos();
  }

  private initElements(): void {
    this.todoInput = document.getElementById('todoInput') as HTMLInputElement;
    this.addBtn = document.getElementById('addBtn') as HTMLButtonElement;
    this.todosList = document.getElementById('todosList') as HTMLUListElement;

    // Modal dialog elements
    this.deleteModal = document.getElementById('deleteModal') as HTMLDivElement;
    this.modalTaskName = document.getElementById('modalTaskName') as HTMLSpanElement;
    this.confirmDeleteBtn = document.getElementById('confirmDelete') as HTMLButtonElement;
    this.cancelDeleteBtn = document.getElementById('cancelDelete') as HTMLButtonElement;
  }

  private bindEvents(): void {
    this.addBtn.addEventListener('click', async () => await this.addTodo());
    this.todoInput.addEventListener('keypress', async (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        await this.addTodo();
      }
    });

    // Modal dialog events
    this.confirmDeleteBtn.addEventListener('click', async () => await this.confirmDelete());
    this.cancelDeleteBtn.addEventListener('click', () =>
      this.closeDeleteModal()
    );

    // Close modal on outside click
    this.deleteModal.addEventListener('click', (e: MouseEvent) => {
      if (e.target === this.deleteModal) {
        this.closeDeleteModal();
      }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.deleteModal.style.display === 'block') {
        this.closeDeleteModal();
      }
    });
  }

  private async loadTodos(): Promise<void> {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.todos = await response.json();
      this.renderTodos();
    } catch (error) {
      console.error('Error loading todos:', error);
      this.showError('Failed to load todos');
    }
  }

  private async addTodo(): Promise<void> {
    const text = this.todoInput.value.trim();
    if (!text) return;

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newTodo: Todo = await response.json();
      this.todos.push(newTodo);
      this.todoInput.value = '';
      this.renderTodos();
    } catch (error) {
      console.error('Error adding todo:', error);
      this.showError('Failed to add todo');
    }
  }

  private async toggleTodo(uuid: string): Promise<void> {
    const todo = this.todos.find((t) => t.uuid === uuid);
    if (!todo) return;

    try {
      const response = await fetch(`/api/todos/${uuid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedTodo: Todo = await response.json();
      const todoIndex = this.todos.findIndex((t) => t.uuid === uuid);
      this.todos[todoIndex] = updatedTodo;
      this.renderTodos();
    } catch (error) {
      console.error('Error toggling todo:', error);
      this.showError('Failed to update todo');
    }
  }

  private async deleteTodo(uuid: string): Promise<void> {
    try {
      const response = await fetch(`/api/todos/${uuid}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.todos = this.todos.filter((t) => t.uuid !== uuid);
      this.renderTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
      this.showError('Failed to delete todo');
    }
  }

  private showDeleteModal(uuid: string): void {
    this.deleteUuid = uuid;
    const todo = this.todos.find((t) => t.uuid === uuid);
    if (!todo) return;

    this.modalTaskName.textContent = todo.text;
    this.deleteModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    // Accessibility: move focus into modal (confirm button as primary action)
    setTimeout(() => {
      this.confirmDeleteBtn?.focus();
    }, 0);
  }

  private closeDeleteModal(): void {
    this.deleteModal.style.display = 'none';
    this.deleteUuid = null;
    document.body.style.overflow = 'auto';
  }

  private async confirmDelete(): Promise<void> {
    if (this.deleteUuid) {
      await this.deleteTodo(this.deleteUuid);
      this.closeDeleteModal();
    }
  }

  private startEdit(uuid: string): void {
    this.editingUuid = uuid;
    this.renderTodos();
  }

  private cancelEdit(): void {
    this.editingUuid = null;
    this.renderTodos();
  }

  private async saveEdit(uuid: string, newText: string): Promise<void> {
    if (!newText.trim()) return;

    try {
      const response = await fetch(`/api/todos/${uuid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newText.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedTodo: Todo = await response.json();
      const todoIndex = this.todos.findIndex((t) => t.uuid === uuid);
      this.todos[todoIndex] = updatedTodo;
      this.editingUuid = null;
      this.renderTodos();
    } catch (error) {
      console.error('Error saving todo:', error);
      this.showError('Failed to save todo');
    }
  }

  private renderTodos(): void {
    if (this.todos.length === 0) {
      this.todosList.innerHTML =
        '<li class="empty-state">No tasks yet. Add your first one!</li>';
      return;
    }

    this.todosList.innerHTML = this.todos
      .map((todo) => {
        if (this.editingUuid === todo.uuid) {
          return this.renderEditTodo(todo);
        }
        return this.renderTodo(todo);
      })
      .join('');

    this.bindTodoEvents();
  }

  private renderTodo(todo: Todo): string {
    return `
      <li class="todo-item ${todo.completed ? 'completed' : ''}">
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-uuid="${todo.uuid}">
        <span class="todo-text">${this.escapeHtml(todo.text)}</span>
        <div class="todo-actions">
          <button class="edit-btn" data-uuid="${todo.uuid}">Edit</button>
          <button class="delete-btn" data-uuid="${todo.uuid}">Delete</button>
        </div>
      </li>
    `;
  }

  private renderEditTodo(todo: Todo): string {
    return `
      <li class="todo-item">
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-uuid="${todo.uuid}">
        <input type="text" class="edit-input" value="${this.escapeHtml(todo.text)}" data-uuid="${todo.uuid}">
        <div class="todo-actions">
          <button class="save-btn" data-uuid="${todo.uuid}">Save</button>
          <button class="cancel-btn" data-uuid="${todo.uuid}">Cancel</button>
        </div>
      </li>
    `;
  }

  private bindTodoEvents(): void {
    // Checkboxes
    document.querySelectorAll('.todo-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const uuid = target.dataset.uuid;
        if (uuid) await this.toggleTodo(uuid);
      });
    });

    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLButtonElement;
        const uuid = target.dataset.uuid;
        if (uuid) this.startEdit(uuid);
      });
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLButtonElement;
        const uuid = target.dataset.uuid;
        if (uuid) this.showDeleteModal(uuid);
      });
    });

    // Save buttons
    document.querySelectorAll('.save-btn').forEach((btn) => {
      btn.addEventListener('click', async (e: Event) => {
        const target = e.target as HTMLButtonElement;
        const uuid = target.dataset.uuid;
        const input = document.querySelector(
          `.edit-input[data-uuid="${uuid}"]`
        ) as HTMLInputElement;
        if (uuid && input) await this.saveEdit(uuid, input.value);
      });
    });

    // Cancel buttons
    document.querySelectorAll('.cancel-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.cancelEdit();
      });
    });

    // Enter key in edit field
    document.querySelectorAll('.edit-input').forEach((input) => {
      input.addEventListener('keypress', async (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter') {
          const target = e.target as HTMLInputElement;
          const uuid = target.dataset.uuid;
          if (uuid) await this.saveEdit(uuid, target.value);
        }
      });
      
      // Escape key to cancel editing
      input.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Escape') {
          this.cancelEdit();
        }
      });
    });
  }

  private showError(message: string): void {
    // Simple error display. Could be enhanced with beautiful notifications in the future
    console.error(message);
    alert(`Error: ${message}`);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  new TodoApp();
});