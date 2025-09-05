class TodoApp {
  constructor() {
    this.todos = [];
    this.editingUuid = null;
    this.deleteUuid = null;

    this.initElements();
    this.bindEvents();
    this.loadTodos();
  }

  initElements() {
    this.todoInput = document.getElementById('todoInput');
    this.addBtn = document.getElementById('addBtn');
    this.todosList = document.getElementById('todosList');

    // Элементы модального окна
    this.deleteModal = document.getElementById('deleteModal');
    this.modalTaskName = document.getElementById('modalTaskName');
    this.confirmDeleteBtn = document.getElementById('confirmDelete');
    this.cancelDeleteBtn = document.getElementById('cancelDelete');
  }

  bindEvents() {
    this.addBtn.addEventListener('click', async () => await this.addTodo());
    this.todoInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        await this.addTodo();
      }
    });

    // События модального окна
    this.confirmDeleteBtn.addEventListener('click', async () => await this.confirmDelete());
    this.cancelDeleteBtn.addEventListener('click', () =>
      this.closeDeleteModal()
    );

    // Закрытие модального окна при клике вне его
    this.deleteModal.addEventListener('click', (e) => {
      if (e.target === this.deleteModal) {
        this.closeDeleteModal();
      }
    });

    // Закрытие модального окна при нажатии Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.deleteModal.style.display === 'block') {
        this.closeDeleteModal();
      }
    });
  }

  async loadTodos() {
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

  async addTodo() {
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

      const newTodo = await response.json();
      this.todos.push(newTodo);
      this.todoInput.value = '';
      this.renderTodos();
    } catch (error) {
      console.error('Error adding todo:', error);
      this.showError('Failed to add todo');
    }
  }

  async toggleTodo(uuid) {
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

      const updatedTodo = await response.json();
      const todoIndex = this.todos.findIndex((t) => t.uuid === uuid);
      this.todos[todoIndex] = updatedTodo;
      this.renderTodos();
    } catch (error) {
      console.error('Error toggling todo:', error);
      this.showError('Failed to update todo');
    }
  }

  async deleteTodo(uuid) {
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

  showDeleteModal(uuid) {
    this.deleteUuid = uuid;
    const todo = this.todos.find((t) => t.uuid === uuid);
    if (!todo) return;

    this.modalTaskName.textContent = todo.text;
    this.deleteModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  closeDeleteModal() {
    this.deleteModal.style.display = 'none';
    this.deleteUuid = null;
    document.body.style.overflow = 'auto';
  }

  async confirmDelete() {
    if (this.deleteUuid) {
      await this.deleteTodo(this.deleteUuid);
      this.closeDeleteModal();
    }
  }

  startEdit(uuid) {
    this.editingUuid = uuid;
    this.renderTodos();
  }

  cancelEdit() {
    this.editingUuid = null;
    this.renderTodos();
  }

  async saveEdit(uuid, newText) {
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

      const updatedTodo = await response.json();
      const todoIndex = this.todos.findIndex((t) => t.uuid === uuid);
      this.todos[todoIndex] = updatedTodo;
      this.editingUuid = null;
      this.renderTodos();
    } catch (error) {
      console.error('Error saving todo:', error);
      this.showError('Failed to save todo');
    }
  }

  renderTodos() {
    if (this.todos.length === 0) {
      this.todosList.innerHTML =
        '<li class="empty-state">Задач пока нет. Добавьте первую!</li>';
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

  renderTodo(todo) {
    return `
      <li class="todo-item ${todo.completed ? 'completed' : ''}">
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-uuid="${todo.uuid}">
        <span class="todo-text">${this.escapeHtml(todo.text)}</span>
        <div class="todo-actions">
          <button class="edit-btn" data-uuid="${todo.uuid}">Изменить</button>
          <button class="delete-btn" data-uuid="${todo.uuid}">Удалить</button>
        </div>
      </li>
    `;
  }

  renderEditTodo(todo) {
    return `
      <li class="todo-item">
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-uuid="${todo.uuid}">
        <input type="text" class="edit-input" value="${this.escapeHtml(todo.text)}" data-uuid="${todo.uuid}">
        <div class="todo-actions">
          <button class="save-btn" data-uuid="${todo.uuid}">Сохранить</button>
          <button class="cancel-btn" data-uuid="${todo.uuid}">Отмена</button>
        </div>
      </li>
    `;
  }

  bindTodoEvents() {
    // Чекбоксы
    document.querySelectorAll('.todo-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', async (e) => {
        const uuid = e.target.dataset.uuid;
        await this.toggleTodo(uuid);
      });
    });

    // Кнопки редактирования
    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const uuid = e.target.dataset.uuid;
        this.startEdit(uuid);
      });
    });

    // Кнопки удаления
    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const uuid = e.target.dataset.uuid;
        this.showDeleteModal(uuid);
      });
    });

    // Кнопки сохранения
    document.querySelectorAll('.save-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const uuid = e.target.dataset.uuid;
        const input = document.querySelector(
          `.edit-input[data-uuid="${uuid}"]`
        );
        await this.saveEdit(uuid, input.value);
      });
    });

    // Кнопки отмены
    document.querySelectorAll('.cancel-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.cancelEdit();
      });
    });

    // Enter в поле редактирования
    document.querySelectorAll('.edit-input').forEach((input) => {
      input.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          const uuid = e.target.dataset.uuid;
          await this.saveEdit(uuid, e.target.value);
        }
      });
      
      // Escape для отмены редактирования
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.cancelEdit();
        }
      });
    });
  }

  showError(message) {
    // Простое отображение ошибки. В будущем можно сделать красивые уведомления
    console.error(message);
    alert(`Ошибка: ${message}`);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  new TodoApp();
});
