# TODO App с Playwright MCP Integration

🎉 **Профессиональное TODO приложение с полной интеграцией тестирования и Playwright MCP!**

## Основные возможности

- ✅ Добавление новых задач
- ✅ Отметка задач как выполненных
- ✅ Редактирование названий задач
- ✅ Удаление задач с подтверждением
- ✅ REST API с валидацией данных
- ✅ Полное тестовое покрытие (API + UI)
- ✅ Playwright MCP для автоматической генерации тестов

## Что реализовано:

### 🏗️ Архитектура:
- **Professional MVC pattern** с разделением на слои
- **Express.js REST API** с middleware и error handling
- **Joi валидация** входных данных
- **JSON файловая база** с автоматическим управлением
- **Responsive UI** с модальными окнами

### 🧪 Тестирование:
- **11 API тестов** (Jest + Supertest) - ✅ 100%
- **12 UI тестов** (Playwright) - ✅ 100% 
- **Responsive тесты** для мобильных устройств
- **Accessibility тесты** с keyboard navigation
- **Полная изоляция данных** между тестами

### 🎭 Playwright MCP Integration:
- **Официальный @playwright/mcp** установлен и настроен
- **MCP Helper утилиты** для автоматизации тестирования
- **Автоматическая генерация тестов** на основе пользовательских действий
- **Интеллектуальный анализ** существующих тестов
- **Кроссплатформенное тестирование** (Chrome, Firefox, Safari, Mobile)
- ✅ REST API со всеми CRUD операциями

## Быстрый старт

### 1. Установите зависимости

```bash
npm install
```

### 2. Запустите приложение

```bash
npm run dev        # Режим разработки
# или
npm start          # Продакшн режим
```

### 3. Откройте приложение

Перейдите в браузере: http://localhost:3001

## Команды для работы

### 🚀 Разработка:
```bash
npm run dev        # Запуск с автоперезагрузкой
npm start          # Продакшн запуск
npm run lint       # Проверка кода
npm run format     # Форматирование кода
```

### 🧪 Тестирование:
```bash
npm test           # API тесты (Jest)
npm run test:ui    # UI тесты (Playwright)
npm run test:all   # Все тесты
npm run test:ui:headed    # UI тесты с браузером
npm run test:ui:debug     # Отладка UI тестов
npm run test:ui:report    # HTML отчет
```

### 🎭 Playwright MCP:
```bash
npm run mcp:help     # Справка по MCP командам
npm run mcp:start    # Запуск MCP сервера
npm run mcp:create   # Создание нового теста
npm run mcp:analyze  # Анализ существующих тестов
npm run mcp:coverage # Отчет о покрытии

# Расширенные MCP тесты:
npx playwright test --config=playwright-mcp.config.js
npx playwright test tests/mcp-generated/
```

## API Endpoints

### GET /api/todos

Получить все задачи

```json
[
  {
    "name": "Купить молоко",
    "completed": false
  }
]
```

### POST /api/todos

Создать новую задачу

```json
{
  "name": "Новая задача"
}
```

### GET /api/todos/:uuid

Получить задачу по UUID

```json
{
  "name": "Купить молоко",
  "completed": false
}
```

### PUT /api/todos/:uuid

Полное обновление задачи

```json
{
  "name": "Обновленное название",
  "completed": true
}
```

### PATCH /api/todos/:uuid

Частичное обновление задачи

```json
{
  "completed": true
}
```

### DELETE /api/todos/:uuid

Удалить задачу

## Структура проекта

```
📁 ai_projects/exprimental/
├── 📁 src/                          # Основной код приложения
│   ├── 📁 api/                      # API маршруты
│   │   ├── todos.routes.js          # CRUD операции для задач
│   │   └── test.routes.js           # Тестовые endpoints
│   ├── 📁 controllers/              # Контроллеры
│   │   └── todos.controller.js      # Бизнес-логика задач
│   ├── 📁 services/                 # Сервисы
│   │   └── todos.service.js         # Работа с данными
│   ├── 📁 middlewares/              # Middleware
│   │   ├── errorHandler.js          # Обработка ошибок
│   │   └── validation.js            # Валидация Joi
│   └── server.js                    # Главный файл сервера
├── 📁 public/                       # Frontend
│   ├── index.html                   # HTML страница
│   ├── script.js                    # JavaScript логика
│   └── styles.css                   # CSS стили
├── 📁 tests/                        # Тесты
│   ├── 📁 api/                      # API тесты (Jest)
│   │   └── todos.test.js            # 11 тестов API
│   ├── 📁 ui/                       # UI тесты (Playwright)
│   │   ├── todo.spec.js             # 12 основных UI тестов
│   │   ├── responsive.spec.js       # Responsive тесты
│   │   └── accessibility.spec.js    # Accessibility тесты
│   ├── 📁 mcp-generated/            # MCP-сгенерированные тесты
│   │   └── example.spec.js          # Пример MCP теста
│   ├── global-setup.js              # Глобальная настройка
│   └── global-teardown.js           # Глобальная очистка
├── 📁 scripts/                      # Утилиты
│   └── playwright-mcp-helper.js     # MCP помощник
├── 📁 docs/                         # Документация
│   └── playwright-mcp-guide.md      # Подробное руководство по MCP
├── 📁 data/                         # База данных
│   └── todos.json                   # JSON файл с задачами
├── playwright.config.js             # Стандартная конфигурация Playwright
├── playwright-mcp.config.js         # Расширенная MCP конфигурация
├── .mcp-config.json                 # Конфигурация MCP сервера
├── jest.config.js                   # Конфигурация Jest
├── .eslintrc.js                     # Настройки ESLint
└── package.json                     # Зависимости и скрипты
```

## Playwright MCP возможности

### 🎯 Автоматическая генерация тестов:
- **Запись действий пользователя** в реальном времени
- **Автоматическое создание селекторов** на основе DOM
- **Генерация проверок (assertions)** на основе состояния страницы
- **Создание тестов** для различных пользовательских сценариев

### 🔍 Интеллектуальный анализ:
- **Анализ существующих тестов** и предложения улучшений
- **Поиск оптимальных селекторов** для стабильности тестов
- **Проверка покрытия** функциональности приложения
- **Обнаружение потенциальных проблем** в тестах

### 📱 Кроссплатформенное тестирование:
- **Множество браузеров**: Chrome, Firefox, Safari, Edge
- **Мобильные устройства**: iPhone, Pixel, iPad
- **Responsive дизайн** тестирование
- **Различные размеры экранов** и ориентации

### ♿ Accessibility тестирование:
- **Keyboard navigation** проверка
- **Screen reader compatibility** тестирование  
- **ARIA attributes** валидация
- **WCAG guidelines** соответствие

## Статистика тестов

**API тесты:** ✅ **11/11 прошли** (Jest + Supertest)
- CRUD операции для TODO
- Валидация входных данных  
- Обработка ошибок
- UUID генерация и валидация

**UI тесты:** ✅ **12/12 прошли** (Playwright)
- Основная функциональность приложения
- Модальные окна и пользовательские взаимодействия
- Редактирование и удаление задач
- Responsive поведение

**MCP тесты:** ✅ **Настроены и готовы**
- Пример автоматически сгенерированного теста
- Шаблоны для создания новых тестов
- Интеграция с ИИ-помощниками для написания тестов

---

🎉 **Итого: 23+ тестов покрывают все аспекты приложения!**

📚 **Подробное руководство по Playwright MCP:** `docs/playwright-mcp-guide.md`
│   ├── styles.css     # CSS стили
│   └── script.js      # JavaScript логика
└── README.md          # Этот файл
```

## Особенности реализации

- **UUID**: Каждая задача имеет уникальный UUID для API операций, но он не отображается в UI
- **Хранение**: Задачи хранятся в памяти (перезапуск сервера сбросит данные)
- **Валидация**: Проверка обязательных полей и типов данных
- **CORS**: Настроен для работы с фронтендом
