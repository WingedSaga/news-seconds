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

const reportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Слишком много жалоб. Попробуйте позже.',
});

module.exports = { registrationLimiter, articleLimiter, commentLimiter, reportLimiter };
