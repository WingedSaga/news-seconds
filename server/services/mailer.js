const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || `НОВОСТИ СЕКУНДЫ <${SMTP_USER}>`;
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

// Без учётных данных SMTP подтверждение почты выключается целиком:
// локальная разработка не должна упираться в почтовый сервер.
const isEnabled = Boolean(SMTP_USER && SMTP_PASS);

let transporter = null;

function getTransporter() {
  if (!isEnabled) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      // Без таймаутов недоступный или отфильтрованный SMTP-порт держит
      // соединение бесконечно, и ошибка никогда не попадает в логи.
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  }
  return transporter;
}

function buildVerificationUrl(token) {
  return `${CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function verificationTemplate(username, url) {
  const safeName = escapeHtml(username);
  const safeUrl = escapeHtml(url);

  const text = [
    `Здравствуйте, ${username}!`,
    '',
    'Вы зарегистрировались на сайте НОВОСТИ СЕКУНДЫ.',
    'Чтобы подтвердить адрес почты, откройте ссылку:',
    url,
    '',
    'Ссылка действительна 24 часа.',
    'Если вы не регистрировались, просто проигнорируйте это письмо.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #333; max-width: 560px;">
      <p style="font-size: 20px; font-weight: bold; color: #2E7D32; margin: 0 0 16px;">
        НОВОСТИ СЕКУНДЫ
      </p>
      <p>Здравствуйте, ${safeName}!</p>
      <p>Вы зарегистрировались на нашем сайте. Чтобы подтвердить адрес почты, нажмите кнопку:</p>
      <p style="margin: 24px 0;">
        <a href="${safeUrl}"
           style="background: #2E7D32; color: #fff; text-decoration: none; padding: 12px 20px;
                  border-radius: 6px; font-weight: bold; display: inline-block;">
          Подтвердить почту
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">
        Если кнопка не работает, скопируйте ссылку в браузер:<br>
        <span style="word-break: break-all;">${safeUrl}</span>
      </p>
      <p style="font-size: 13px; color: #666;">
        Ссылка действительна 24 часа. Если вы не регистрировались, просто проигнорируйте это письмо.
      </p>
    </div>
  `;

  return { text, html };
}

// Проверка учётных данных SMTP при старте: ошибка авторизации должна быть
// видна сразу в логах, а не всплывать при первой регистрации.
async function verifyConnection() {
  const mailer = getTransporter();
  if (!mailer) return { ok: false, reason: 'disabled' };

  try {
    await mailer.verify();
    console.log(`[mailer] SMTP ${SMTP_HOST}:${SMTP_PORT} принял учётные данные ${SMTP_USER}`);
    return { ok: true };
  } catch (err) {
    console.error(`[mailer] SMTP ${SMTP_HOST}:${SMTP_PORT} отклонил подключение:`, err.message);
    return { ok: false, reason: err.message };
  }
}

// Отправка не должна ронять регистрацию: об ошибке сообщаем через результат.
async function sendVerificationEmail({ to, username, token }) {
  const mailer = getTransporter();
  if (!mailer) return { sent: false, reason: 'disabled' };

  const url = buildVerificationUrl(token);
  const { text, html } = verificationTemplate(username, url);

  try {
    const info = await mailer.sendMail({
      from: MAIL_FROM,
      to,
      subject: 'Подтверждение почты — НОВОСТИ СЕКУНДЫ',
      text,
      html,
    });
    console.log(`[mailer] письмо отправлено на ${to}, ответ сервера: ${info.response}`);
    return { sent: true };
  } catch (err) {
    console.error(`[mailer] не удалось отправить письмо на ${to}:`, err.message);
    return { sent: false, reason: 'error' };
  }
}

module.exports = { isEnabled, verifyConnection, sendVerificationEmail, buildVerificationUrl };
