interface Todo {
    uuid: string;
    text: string;
    completed: boolean;
    created_at: string;
}
declare class TodoApp {
    private todos;
    private editingUuid;
    private deleteUuid;
    private todoInput;
    private addBtn;
    private todosList;
    private deleteModal;
    private modalTaskName;
    private confirmDeleteBtn;
    private cancelDeleteBtn;
    constructor();
    private initElements;
    private bindEvents;
    private loadTodos;
    private addTodo;
    private toggleTodo;
    private deleteTodo;
    private showDeleteModal;
    private closeDeleteModal;
    private confirmDelete;
    private startEdit;
    private cancelEdit;
    private saveEdit;
    private renderTodos;
    private renderTodo;
    private renderEditTodo;
    private bindTodoEvents;
    private showError;
    private escapeHtml;
}
//# sourceMappingURL=script.d.ts.map