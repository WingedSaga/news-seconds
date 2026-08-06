const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const { createTicket, myTickets, replyToTicket } = require('../controllers/supportController');

const router = express.Router();

// Форма открыта и гостям, поэтому ограничиваем частоту обращений.
const supportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Слишком много обращений. Повторите позже.' },
});

router.post(
  '/',
  supportLimiter,
  optionalAuth,
  [
    body('subject')
      .trim()
      .isLength({ min: 5, max: 150 })
      .withMessage('Тема должна быть от 5 до 150 символов'),
    body('text')
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Опишите вопрос подробнее: от 10 до 5000 символов'),
    body('name')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ min: 2, max: 60 })
      .withMessage('Имя должно быть от 2 до 60 символов'),
    body('email')
      .optional({ values: 'falsy' })
      .trim()
      .isEmail()
      .withMessage('Введите корректный email')
      .normalizeEmail(),
  ],
  validate,
  createTicket
);

router.get('/mine', authMiddleware, myTickets);

router.post(
  '/:id/messages',
  authMiddleware,
  [
    param('id').isUUID().withMessage('Некорректный идентификатор обращения'),
    body('text')
      .trim()
      .isLength({ min: 2, max: 5000 })
      .withMessage('Сообщение должно быть от 2 до 5000 символов'),
  ],
  validate,
  replyToTicket
);

module.exports = router;
