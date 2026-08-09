const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const { reportLimiter } = require('../middleware/rateLimiters');
const { createReport } = require('../controllers/reportsController');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  reportLimiter,
  [
    body('target_type').isIn(['article', 'comment']).withMessage('Некорректный тип жалобы'),
    body('target_id').isUUID().withMessage('Некорректный идентификатор'),
    body('reason').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Причина не длиннее 500 символов'),
  ],
  validate,
  createReport
);

module.exports = router;
