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
  listReports,
  updateReportStatus,
  setFeaturedArticle,
  deleteComment,
  bulkArticles,
  deleteUser,
  listLogs,
  listLoginActivity,
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
  updateUserUsername,
  resetUserPassword,
  updateUserBan,
  updateUserSubscription,
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
    body('ads').optional().isArray({ max: 6 }).withMessage('Можно добавить до 6 рекламных блоков'),
    body('ads.*.placement').optional().isIn(['home_top', 'home_after_lead', 'home_bottom']).withMessage('Некорректное место рекламы'),
    body('ads.*.title').optional().trim().isLength({ max: 90 }).withMessage('Заголовок рекламы не длиннее 90 символов'),
    body('ads.*.text').optional().trim().isLength({ max: 220 }).withMessage('Текст рекламы не длиннее 220 символов'),
    body('ads.*.url').optional({ values: 'falsy' }).trim().isURL({ protocols: ['https'], require_protocol: true }).withMessage('Укажите безопасную HTTPS-ссылку'),
    body('ads.*.enabled').optional().isBoolean().toBoolean(),
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
router.patch('/articles/:id/featured', [param('id').isUUID().withMessage('Некорректный идентификатор статьи')], validate, setFeaturedArticle);

router.patch(
  '/articles/:id/status',
  [
    param('id').isUUID().withMessage('Некорректный идентификатор статьи'),
    body('status')
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Недопустимый статус статьи'),
    body('moderation_note')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Причина отклонения не длиннее 1000 символов'),
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
router.get('/reports', listReports);
router.patch('/reports/:id/status', [param('id').isUUID().withMessage('Некорректный идентификатор жалобы'), body('status').isIn(['new', 'resolved', 'dismissed']).withMessage('Некорректный статус')], validate, updateReportStatus);

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
router.get('/login-activity', listLoginActivity);

router.get(
  '/export/:entity',
  [param('entity').isIn(['users', 'articles']).withMessage('Неизвестный тип выгрузки')],
  validate,
  exportCsv
);

router.get('/users', listUsers);

router.patch(
  '/users/:id/username',
  [
    param('id').isUUID().withMessage('Некорректный идентификатор пользователя'),
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Имя пользователя должно быть от 3 до 30 символов')
      .matches(/^[a-zA-Zа-яА-ЯёЁ0-9_-]+$/)
      .withMessage('Имя может содержать только буквы, цифры, дефис и подчёркивание'),
  ],
  validate,
  updateUserUsername
);

router.patch(
  '/users/:id/password',
  [
    param('id').isUUID().withMessage('Invalid user identifier'),
    body('password').isString().isLength({ min: 8, max: 128 }).withMessage('Password must be 8 to 128 characters'),
  ],
  validate,
  resetUserPassword
);

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

router.patch(
  '/users/:id/subscription',
  [
    param('id').isUUID().withMessage('Некорректный идентификатор пользователя'),
    body('action').isIn(['grant', 'revoke']).withMessage('Некорректное действие'),
    body('expires_at').optional({ values: 'falsy' }).isISO8601().withMessage('Некорректная дата окончания'),
  ],
  validate,
  updateUserSubscription
);

module.exports = router;
