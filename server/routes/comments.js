const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const { listComments, createComment, deleteComment } = require('../controllers/commentsController');

const router = express.Router();

router.get(
  '/article/:articleId',
  [param('articleId').isUUID().withMessage('Некорректный идентификатор статьи')],
  validate,
  listComments
);

router.post(
  '/',
  authMiddleware,
  [
    body('article_id').isUUID().withMessage('Некорректный идентификатор статьи'),
    body('text')
      .trim()
      .isLength({ min: 2, max: 1000 })
      .withMessage('Комментарий должен быть от 2 до 1000 символов'),
  ],
  validate,
  createComment
);

router.delete(
  '/:id',
  authMiddleware,
  [param('id').isUUID().withMessage('Некорректный идентификатор комментария')],
  validate,
  deleteComment
);

module.exports = router;
