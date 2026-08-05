const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const { register, login, me } = require('../controllers/authController');

const router = express.Router();

// Ограничение попыток входа и регистрации с одного адреса.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Слишком много попыток. Повторите позже.' },
});

router.post(
  '/register',
  authLimiter,
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Имя пользователя должно быть от 3 до 30 символов')
      .matches(/^[a-zA-Zа-яА-ЯёЁ0-9_-]+$/)
      .withMessage('Имя может содержать только буквы, цифры, дефис и подчёркивание'),
    body('email').trim().isEmail().withMessage('Введите корректный email').normalizeEmail(),
    body('password')
      .isLength({ min: 6, max: 72 })
      .withMessage('Пароль должен быть не короче 6 символов'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('Введите корректный email').normalizeEmail(),
    body('password').notEmpty().withMessage('Введите пароль'),
  ],
  validate,
  login
);

router.get('/me', authMiddleware, me);

module.exports = router;
