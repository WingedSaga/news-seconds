const rateLimit = require('express-rate-limit');

function createLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });
}

// Защита самого API от всплесков запросов с одного IP. Точечные лимиты ниже
// остаются строже для регистрации, комментариев и других дорогих операций.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/health',
  message: { message: 'Слишком много запросов. Попробуйте через минуту.' },
});

// Лимиты разделены по действиям: активный читатель может комментировать, но не может
// использовать ту же квоту для массовой регистрации или публикации материалов.
const registrationLimiter = createLimiter({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: 'Слишком много регистраций с этого адреса. Попробуйте через 30 минут.',
});

const articleLimiter = createLimiter({
  windowMs: 30 * 60 * 1000,
  max: 5,
  message: 'Можно отправить не больше пяти материалов за 30 минут. Попробуйте позже.',
});

const commentLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: 'Слишком много комментариев. Подождите пять минут.',
});

// Общий лимит API остаётся для всех. Подписчики получают повышенные лимиты
// именно на повседневные действия: комментарии и предложения новостей.
articleLimiter.skip = (req) => Boolean(req.user?.subscription?.is_active);
commentLimiter.skip = (req) => Boolean(req.user?.subscription?.is_active);

const reportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Слишком много жалоб. Попробуйте позже.',
});

const checkoutLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Слишком много попыток открыть оплату. Попробуйте позже.',
});

// Загрузка файлов особенно затратна для небольшого домашнего сервера:
// ограничения не позволяют занять память, диск или перекодировщик множеством
// параллельных файлов. Они применяются после авторизации и отдельно для
// обычных изображений и тяжёлых аудио/видео.
const imageUploadLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Слишком много загрузок изображений. Попробуйте через 15 минут.',
});

const mediaUploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Можно загрузить не больше трёх аудио или видео за час.',
});

module.exports = {
  apiLimiter,
  registrationLimiter,
  articleLimiter,
  commentLimiter,
  reportLimiter,
  checkoutLimiter,
  imageUploadLimiter,
  mediaUploadLimiter,
};
