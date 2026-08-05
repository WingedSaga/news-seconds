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

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
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

app.use('/api/auth', require('./routes/auth'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/comments', require('./routes/comments'));
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
      isEnabled ? `включено, отправка через ${provider}` : 'выключено (нет RESEND_API_KEY и SMTP)'
    }`
  );

  // Результат проверки только пишем в лог: недоступный SMTP не повод
  // не поднимать сайт, остальные разделы от почты не зависят.
  if (isEnabled) verifyConnection();
});

module.exports = app;
