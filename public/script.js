class TodoApp {
    constructor() {
        this.todos = [];
        this.editingIndex = -1;
        
        this.initElements();
        this.bindEvents();
        this.loadTodos();
    }

    initElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todosList = document.getElementById('todosList');
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });
    }

    async loadTodos() {
        try {
            const response = await fetch('/api/todos');
            this.todos = await response.json();
            this.renderTodos();
        } catch (error) {
            console.error('Error loading todos:', error);
        }
    }

    async addTodo() {
        const name = this.todoInput.value.trim();
        if (!name) return;

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });

            if (response.ok) {
                this.todoInput.value = '';
                await this.loadTodos(); // Перезагружаем список
            }
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    }

    async toggleTodo(index) {
        const todo = this.todos[index];
        const uuid = await this.getTodoUuid(index);
        
        try {
            const response = await fetch(`/api/todos/${uuid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed: !todo.completed }),
            });

            if (response.ok) {
                await this.loadTodos();
            }
        } catch (error) {
            console.error('Error toggling todo:', error);
        }
    }

    async deleteTodo(index) {
        const uuid = await this.getTodoUuid(index);
        
        try {
            const response = await fetch(`/api/todos/${uuid}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await this.loadTodos();
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    }

    startEdit(index) {
        this.editingIndex = index;
        this.renderTodos();
    }

    cancelEdit() {
        this.editingIndex = -1;
        this.renderTodos();
    }

    async saveEdit(index, newName) {
        if (!newName.trim()) return;
        
        const uuid = await this.getTodoUuid(index);
        
        try {
            const response = await fetch(`/api/todos/${uuid}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newName.trim() }),
            });

            if (response.ok) {
                this.editingIndex = -1;
                await this.loadTodos();
            }
        } catch (error) {
            console.error('Error saving todo:', error);
        }
    }

    async getTodoUuid(index) {
        try {
            const response = await fetch(`/api/todos/uuid/${index}`);
            if (response.ok) {
                const data = await response.json();
                return data.uuid;
            }
            throw new Error('Failed to get UUID');
        } catch (error) {
            console.error('Error getting todo UUID:', error);
            return null;
        }
    }

    renderTodos() {
        if (this.todos.length === 0) {
            this.todosList.innerHTML = '<li class="empty-state">Задач пока нет. Добавьте первую!</li>';
            return;
        }

        this.todosList.innerHTML = this.todos.map((todo, index) => {
            if (this.editingIndex === index) {
                return this.renderEditTodo(todo, index);
            }
            return this.renderTodo(todo, index);
        }).join('');

        // Привязываем события после рендера
        this.bindTodoEvents();
    }

    renderTodo(todo, index) {
        return `
            <li class="todo-item ${todo.completed ? 'completed' : ''}">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-index="${index}">
                <span class="todo-text">${this.escapeHtml(todo.name)}</span>
                <div class="todo-actions">
                    <button class="edit-btn" data-index="${index}">Изменить</button>
                    <button class="delete-btn" data-index="${index}">Удалить</button>
                </div>
            </li>
        `;
    }

    renderEditTodo(todo, index) {
        return `
            <li class="todo-item">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-index="${index}">
                <input type="text" class="edit-input" value="${this.escapeHtml(todo.name)}" data-index="${index}">
                <div class="todo-actions">
                    <button class="save-btn" data-index="${index}">Сохранить</button>
                    <button class="cancel-btn" data-index="${index}">Отмена</button>
                </div>
            </li>
        `;
    }

    bindTodoEvents() {
        // Чекбоксы
        document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.toggleTodo(index);
            });
        });

        // Кнопки редактирования
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.startEdit(index);
            });
        });

        // Кнопки удаления
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
                    this.deleteTodo(index);
                }
            });
        });

        // Кнопки сохранения
        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const input = document.querySelector(`.edit-input[data-index="${index}"]`);
                this.saveEdit(index, input.value);
            });
        });

        // Кнопки отмены
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.cancelEdit();
            });
        });

        // Enter в поле редактирования
        document.querySelectorAll('.edit-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const index = parseInt(e.target.dataset.index);
                    this.saveEdit(index, e.target.value);
                }
            });
        });
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
