const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for todos
let todos = [];

// Routes

// GET all todos (без uuid в ответе, но с индексом для идентификации)
app.get('/api/todos', (req, res) => {
  const todosWithIndex = todos.map(({ uuid, ...todo }, index) => ({ 
    ...todo, 
    index 
  }));
  res.json(todosWithIndex);
});

// GET single todo by uuid
app.get('/api/todos/:uuid', (req, res) => {
  const todo = todos.find(t => t.uuid === req.params.uuid);
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  const { uuid, ...todoWithoutUuid } = todo;
  res.json(todoWithoutUuid);
});

// GET UUID by index (для внутренних нужд фронтенда)
app.get('/api/todos/uuid/:index', (req, res) => {
  const index = parseInt(req.params.index);
  if (index < 0 || index >= todos.length) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  res.json({ uuid: todos[index].uuid });
});

// POST new todo
app.post('/api/todos', (req, res) => {
  const { name } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required and must be a string' });
  }

  const newTodo = {
    uuid: uuidv4(),
    name: name.trim(),
    completed: false
  };

  todos.push(newTodo);
  
  // Возвращаем без uuid, но с индексом
  const todoIndex = todos.length - 1;
  const { uuid, ...todoWithoutUuid } = newTodo;
  res.status(201).json({ ...todoWithoutUuid, index: todoIndex });
});

// PUT update todo by uuid (полное обновление)
app.put('/api/todos/:uuid', (req, res) => {
  const todoIndex = todos.findIndex(t => t.uuid === req.params.uuid);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const { name, completed } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required and must be a string' });
  }

  todos[todoIndex] = {
    uuid: req.params.uuid,
    name: name.trim(),
    completed: Boolean(completed)
  };

  const { uuid, ...todoWithoutUuid } = todos[todoIndex];
  res.json(todoWithoutUuid);
});

// PATCH update todo by uuid (частичное обновление)
app.patch('/api/todos/:uuid', (req, res) => {
  const todoIndex = todos.findIndex(t => t.uuid === req.params.uuid);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  const { name, completed } = req.body;
  const todo = todos[todoIndex];

  if (name !== undefined) {
    if (typeof name !== 'string') {
      return res.status(400).json({ error: 'Name must be a string' });
    }
    todo.name = name.trim();
  }

  if (completed !== undefined) {
    todo.completed = Boolean(completed);
  }

  const { uuid, ...todoWithoutUuid } = todo;
  res.json(todoWithoutUuid);
});

// DELETE todo by uuid
app.delete('/api/todos/:uuid', (req, res) => {
  const todoIndex = todos.findIndex(t => t.uuid === req.params.uuid);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos.splice(todoIndex, 1);
  res.status(204).send();
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
