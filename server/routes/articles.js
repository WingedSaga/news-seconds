const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const {
  listArticles,
  featuredArticle,
  tickerArticles,
  myArticles,
  getArticle,
  createArticle,
  listBookmarks,
  toggleBookmark,
} = require('../controllers/articlesController');

const router = express.Router();

router.get('/', listArticles);
router.get('/featured', featuredArticle);
router.get('/ticker', tickerArticles);
router.get('/mine', authMiddleware, myArticles);
router.get('/bookmarks/list', authMiddleware, listBookmarks);

router.post(
  '/',
  authMiddleware,
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Заголовок должен быть от 5 до 200 символов'),
    body('content')
      .trim()
      .isLength({ min: 20, max: 20000 })
      .withMessage('Текст должен быть от 20 до 20000 символов'),
    body('category')
      .isIn(['news', 'joke', 'weather'])
      .withMessage('Выберите категорию: новости, анекдоты или погода'),
    body('image_url')
      .optional({ values: 'falsy' })
      .trim()
      .isURL()
      .withMessage('Ссылка на изображение некорректна'),
    body('image_urls')
      .optional()
      .isArray({ max: 5 })
      .withMessage('К новости можно приложить не больше пяти изображений'),
    body('image_urls.*').trim().isURL().withMessage('Ссылка на изображение некорректна'),
    body('media_url')
      .optional({ values: 'falsy' })
      .trim()
      .isURL()
      .withMessage('Ссылка на вложение некорректна'),
    body('media_type')
      .optional({ values: 'falsy' })
      .isIn(['audio', 'video'])
      .withMessage('Тип вложения должен быть audio или video'),
  ],
  validate,
  createArticle
);

router.post(
  '/:id/bookmark',
  authMiddleware,
  [param('id').isUUID().withMessage('Некорректный идентификатор статьи')],
  validate,
  toggleBookmark
);

router.get(
  '/:id',
  optionalAuth,
  [param('id').isUUID().withMessage('Некорректный идентификатор статьи')],
  validate,
  getArticle
);

module.exports = router;
