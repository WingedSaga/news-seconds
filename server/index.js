require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { notFound, errorHandler } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  throw new Error('Не задана переменная окружения JWT_SECRET. См. server/.env.example');
}

const app = express();

app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));

const builtInAllowedOrigins = [
  'http://localhost:5173',
  'https://news-seconds.duckdns.org',
  'https://wingedsaga.github.io',
];

const allowedOrigins = [
  ...builtInAllowedOrigins,
  ...(process.env.CORS_ORIGIN || '').split(','),
]
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Запросы без Origin (curl, health-check) пропускаем.
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Источник запроса не разрешён политикой CORS'));
    },
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'novosti-sekundy-api' });
});

const { optionalAuth } = require('./middleware/authMiddleware');
const { maintenanceGuard } = require('./middleware/maintenance');

// Настройки и авторизация доступны всегда: без них не выйти из режима
// обслуживания и не попасть в админ-панель.
app.use('/api/settings', require('./routes/settings'));
app.use('/api/auth', require('./routes/auth'));

app.use('/api/articles', optionalAuth, maintenanceGuard, require('./routes/articles'));
app.use('/api/comments', optionalAuth, maintenanceGuard, require('./routes/comments'));
app.use('/api/reports', optionalAuth, maintenanceGuard, require('./routes/reports'));
app.use('/api/support', require('./routes/support'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  const { isEnabled, provider, verifyConnection } = require('./services/mailer');
  console.log(`[server] НОВОСТИ СЕКУНДЫ API запущен на порту ${PORT}`);
  console.log(
    `[server] подтверждение почты: ${
      isEnabled
        ? `включено, отправка через ${provider}`
        : 'выключено — аккаунты активны сразу после регистрации'
    }`
  );

  // Результат проверки только пишем в лог: недоступный SMTP не повод
  // не поднимать сайт, остальные разделы от почты не зависят.
  if (isEnabled) verifyConnection();

  // Проверка схемы: отставшая база — самая частая причина ошибок 500.
  // Определяем доступные колонки, чтобы лента работала даже без миграций.
  require('./db/schemaState').detectArticleColumns();
  require('./db/schemaState').detectCommentColumns();
  require('./db/checkSchema').checkSchema();
});

module.exports = app;
