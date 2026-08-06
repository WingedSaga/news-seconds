const nodemailer = require('nodemailer');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Базовый адрес вынесен в переменную: он подменяется в тестах и при
// использовании собственного прокси до API.
const RESEND_API_BASE = (process.env.RESEND_API_BASE || 'https://api.resend.com').replace(/\/$/, '');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

// Resend ходит по обычному HTTPS: хостинги часто фильтруют исходящий SMTP,
// и тогда письма молча не уходят. Поэтому он в приоритете, SMTP — запасной.
const provider = RESEND_API_KEY ? 'resend' : SMTP_USER && SMTP_PASS ? 'smtp' : 'none';
const isEnabled = provider !== 'none';

// Без своего домена Resend разрешает отправку только с этого адреса.
const DEFAULT_FROM =
  provider === 'resend'
    ? 'НОВОСТИ СЕКУНДЫ <onboarding@resend.dev>'
    : `НОВОСТИ СЕКУНДЫ <${SMTP_USER}>`;

// Публичные почтовые домены нельзя подтвердить в Resend: отправка с такого
// адреса отклоняется всегда. Свой домен в этот список не попадёт, поэтому
// настоящая настройка отправителя продолжает работать.
const PUBLIC_MAILBOX_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yandex.ru',
  'ya.ru',
  'mail.ru',
  'bk.ru',
  'inbox.ru',
  'list.ru',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
]);

function senderDomain(value) {
  const match = String(value).match(/@([^>\s]+)/);
  return match ? match[1].toLowerCase() : '';
}

function resolveFrom() {
  const configured = process.env.MAIL_FROM;
  if (!configured) return DEFAULT_FROM;

  if (provider === 'resend' && PUBLIC_MAILBOX_DOMAINS.has(senderDomain(configured))) {
    console.warn(
      `[mailer] MAIL_FROM=${configured} игнорируется: домен ${senderDomain(configured)} ` +
        `нельзя подтвердить в Resend. Отправитель: ${DEFAULT_FROM}. ` +
        'Чтобы писать со своего адреса, подтвердите собственный домен на resend.com/domains.'
    );
    return DEFAULT_FROM;
  }

  return configured;
}

const MAIL_FROM = resolveFrom();

const REQUEST_TIMEOUT_MS = 15000;

let transporter = null;

function getTransporter() {
  if (provider !== 'smtp') return null;
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

// Отправка через HTTP API Resend.
async function sendViaResend({ to, subject, text, html }) {
  const response = await fetch(`${RESEND_API_BASE}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, text, html }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Resend возвращает причину в поле message — она информативнее кода.
    throw new Error(payload.message || `HTTP ${response.status}`);
  }

  return payload.id || 'ok';
}

// Проверка учётных данных при старте: ошибка авторизации должна быть
// видна сразу в логах, а не всплывать как молча непришедшие письма.
async function verifyConnection() {
  if (provider === 'none') return { ok: false, reason: 'disabled' };

  if (provider === 'resend') {
    try {
      const response = await fetch(`${RESEND_API_BASE}/domains`, {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      // Список доменов доступен только ключам с полными правами, поэтому
      // отказ здесь не означает нерабочий ключ: ключ с правами только на
      // отправку писем ведёт себя ровно так же. Окончательный ответ даёт
      // первая реальная отправка, её результат тоже пишется в лог.
      if (response.status === 401 || response.status === 403) {
        console.log(
          `[mailer] Resend настроен, отправитель: ${MAIL_FROM}. ` +
            'Права ключа не позволяют опросить /domains — это нормально для ключа ' +
            'с доступом только на отправку, проверка произойдёт при первом письме.'
        );
        return { ok: true, reason: 'limited_scope' };
      }

      if (!response.ok) {
        const body = (await response.text().catch(() => '')).slice(0, 200);
        console.error(`[mailer] Resend ответил ${response.status}: ${body}`);
        return { ok: false, reason: `http_${response.status}` };
      }

      console.log(`[mailer] Resend принял ключ, отправитель: ${MAIL_FROM}`);
      return { ok: true };
    } catch (err) {
      console.error('[mailer] не удалось связаться с Resend:', err.message);
      return { ok: false, reason: err.message };
    }
  }

  const mailer = getTransporter();
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
  if (provider === 'none') return { sent: false, reason: 'disabled' };

  const url = buildVerificationUrl(token);
  const { text, html } = verificationTemplate(username, url);
  const subject = 'Подтверждение почты — НОВОСТИ СЕКУНДЫ';

  try {
    if (provider === 'resend') {
      const id = await sendViaResend({ to, subject, text, html });
      console.log(`[mailer] Resend принял письмо для ${to}, id: ${id}`);
    } else {
      const info = await getTransporter().sendMail({ from: MAIL_FROM, to, subject, text, html });
      console.log(`[mailer] письмо отправлено на ${to}, ответ сервера: ${info.response}`);
    }
    return { sent: true };
  } catch (err) {
    console.error(`[mailer] не удалось отправить письмо на ${to}:`, err.message);
    return { sent: false, reason: 'error' };
  }
}

module.exports = {
  isEnabled,
  provider,
  verifyConnection,
  sendVerificationEmail,
  buildVerificationUrl,
};
