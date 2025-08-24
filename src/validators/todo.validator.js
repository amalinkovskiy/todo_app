const Joi = require('joi');

// Схема для создания новой задачи
const createTodoSchema = Joi.object({
  text: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.empty': 'Текст задачи не может быть пустым',
      'string.min': 'Текст задачи должен содержать минимум 1 символ',
      'string.max': 'Текст задачи не может превышать 500 символов',
      'any.required': 'Текст задачи обязателен'
    })
});

// Схема для обновления задачи
const updateTodoSchema = Joi.object({
  text: Joi.string()
    .trim()
    .min(1)
    .max(500)
    .optional()
    .messages({
      'string.empty': 'Текст задачи не может быть пустым',
      'string.min': 'Текст задачи должен содержать минимум 1 символ',
      'string.max': 'Текст задачи не может превышать 500 символов'
    }),
  completed: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Статус выполнения должен быть булевым значением'
    })
}).min(1).messages({
  'object.min': 'Необходимо указать хотя бы одно поле для обновления'
});

// Схема для валидации UUID
const uuidSchema = Joi.string()
  .uuid() // Принимает любую версию UUID
  .required()
  .messages({
    'string.guid': 'Некорректный формат ID',
    'any.required': 'ID обязателен'
  });

// Middleware для валидации тела запроса
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Собрать все ошибки валидации
      stripUnknown: true // Удалить неизвестные поля
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Ошибка валидации',
        errors
      });
    }

    // Заменяем req.body на очищенные и валидированные данные
    req.body = value;
    next();
  };
};

// Middleware для валидации параметров (например, ID)
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Ошибка валидации параметров',
        errors
      });
    }

    req.params = value;
    next();
  };
};

module.exports = {
  createTodoSchema,
  updateTodoSchema,
  uuidSchema,
  validateBody,
  validateParams
};
