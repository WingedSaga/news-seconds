const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');
const {
  listTickets,
  updateTicketStatus,
  answerTicket,
  listComments,
  deleteComment,
  bulkArticles,
  deleteUser,
  listLogs,
  exportCsv,
  getSettings,
  updateSettings,
  promoteByEmail,
  stats,
  listArticles,
  updateArticleStatus,
  updateArticle,
  deleteArticle,
  listUsers,
  updateUserRole,
  updateUserBan,
} = require('../controllers/adminController');

const router = express.Router();

// Весь раздел доступен только администраторам.
router.use(authMiddleware, adminMiddleware);

router.get('/stats', stats);

router.get('/settings', getSettings);

router.patch(
  '/settings',
  [
    body('email_verification').optional().isBoolean().withMessage('Некорректное значение').toBoolean(),
    body('registration_open').optional().isBoolean().withMessage('Некорректное значение').toBoolean(),
    body('comments_enabled').optional().isBoolean().withMessage('Некорректное значение').toBoolean(),
    body('auto_approve_articles').optional().isBoolean().withMessage('Некорректное значение').toBoolean(),
    body('maintenance_mode').optional().isBoolean().withMessage('Некорректное значение').toBoolean(),
    body('site_tagline')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Подзаголовок не длиннее 200 символов'),
    body('site_title')
      .optional()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Название от 2 до 80 символов'),
  ],
  validate,
  updateSettings
);

router.post(
  '/users/promote',
  [body('email').trim().isEmail().withMessage('Введите корректный email').normalizeEmail()],
  validate,
  promoteByEmail
);

router.get('/articles', listArticles);

router.patch(
  '/articles/:id/status',
  [
    param('id').isUUID().withMessage('Некорректный идентификатор статьи'),
    body('status')
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Недопустимый статус статьи'),
  ],
  validate,
  updateArticleStatus
);

router.put(
  '/articles/:id',
  [
    param('id').isUUID().withMessage('Некорректный идентификатор статьи'),
    body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Заголовок должен быть от 5 до 200 символов'),
    body('content').optional().trim().isLength({ min: 1, max: 20000 }).withMessage('Напишите текст новости — не длиннее 20000 символов'),
    body('category').optional().isIn(['news', 'joke', 'weather', 'other']).withMessage('Недопустимая категория'),
    body('status').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Недопустимый статус статьи'),
  ],
  validate,
  updateArticle
);

router.delete(
  '/articles/:id',
  [param('id').isUUID().withMessage('Некорректный идентификатор статьи')],
  validate,
  deleteArticle
);

router.get('/comments', listComments);

router.delete(
  '/comments/:id',
  [param('id').isUUID().withMessage('Некорректный идентификатор комментария')],
  validate,
  deleteComment
);

router.post(
  '/articles/bulk',
  [
    body('ids').isArray({ min: 1, max: 100 }).withMessage('Выберите хотя бы одну статью'),
    body('ids.*').isUUID().withMessage('Некорректный идентификатор статьи'),
    body('action').isIn(['approve', 'reject', 'delete']).withMessage('Неизвестное действие'),
  ],
  validate,
  bulkArticles
);

router.get('/support', listTickets);

router.patch(
  '/support/:id/status',
  [
    param('id').isUUID().withMessage('Некорректный идентификатор обращения'),
    body('status').isIn(['new', 'in_progress', 'closed']).withMessage('Недопустимый статус'),
  ],
  validate,
  updateTicketStatus
);

router.post(
  '/support/:id/messages',
  [
    param('id').isUUID().withMessage('Некорректный идентификатор обращения'),
    body('text').trim().isLength({ min: 2, max: 5000 }).withMessage('Сообщение от 2 до 5000 символов'),
  ],
  validate,
  answerTicket
);

router.get('/logs', listLogs);

router.get(
  '/export/:entity',
  [param('entity').isIn(['users', 'articles']).withMessage('Неизвестный тип выгрузки')],
  validate,
  exportCsv
);

router.get('/users', listUsers);

router.delete(
  '/users/:id',
  [param('id').isUUID().withMessage('Некорректный идентификатор пользователя')],
  validate,
  deleteUser
);

router.patch(
  '/users/:id/role',
  [
    param('id').isUUID().withMessage('Некорректный идентификатор пользователя'),
    body('role').isIn(['user', 'admin']).withMessage('Недопустимая роль'),
  ],
  validate,
  updateUserRole
);

router.patch(
  '/users/:id/ban',
  [
    param('id').isUUID().withMessage('Некорректный идентификатор пользователя'),
    body('is_banned').isBoolean().withMessage('Некорректное значение блокировки').toBoolean(),
  ],
  validate,
  updateUserBan
);

module.exports = router;
