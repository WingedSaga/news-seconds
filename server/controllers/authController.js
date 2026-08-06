const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../db/supabase');
const { USER_FIELDS } = require('../middleware/authMiddleware');
const mailer = require('../services/mailer');
const settings = require('../services/settings');

const SALT_ROUNDS = 10;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
// Не даём слать письма чаще, чем раз в минуту на один адрес.
const RESEND_COOLDOWN_MS = 60 * 1000;

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar_url: user.avatar_url,
    email_verified: user.email_verified,
    created_at: user.created_at,
  };
}

// Пользователю уходит сырой токен, в базу — только его хеш.
function createVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    hash: crypto.createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

// Подтверждение требуется, только если оно включено в настройках
// и почту действительно есть чем отправлять.
async function verificationRequired() {
  return mailer.isEnabled && (await settings.getSetting('email_verification'));
}

async function register(req, res, next) {
  try {
    if (!(await settings.getSetting('registration_open'))) {
      return res.status(403).json({ message: 'Регистрация на сайте временно закрыта' });
    }

    const requireVerification = await verificationRequired();
    const username = String(req.body.username).trim();
    const email = String(req.body.email).trim().toLowerCase();
    const { password } = req.body;

    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('id, email, username')
      .or(`email.eq.${email},username.eq.${username}`)
      .limit(1);

    if (lookupError) throw lookupError;

    if (existing && existing.length > 0) {
      const clash = existing[0];
      return res.status(409).json({
        message:
          clash.email === email
            ? 'Пользователь с таким email уже зарегистрирован'
            : 'Это имя пользователя уже занято',
      });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const verification = requireVerification ? createVerificationToken() : null;

    const { data: created, error: insertError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password_hash,
        role: 'user',
        // Когда подтверждение выключено, аккаунт активен сразу.
        email_verified: !requireVerification,
        verification_token_hash: verification?.hash || null,
        verification_expires_at: verification?.expiresAt || null,
        verification_sent_at: verification ? new Date().toISOString() : null,
      })
      .select(`${USER_FIELDS}`)
      .single();

    if (insertError) throw insertError;

    if (!verification) {
      return res.status(201).json({
        token: signToken(created),
        user: publicUser(created),
        requiresVerification: false,
      });
    }

    // Письмо уходит в фоне: рукопожатие с SMTP занимает секунды, и держать
    // на нём HTTP-ответ незачем. Если отправка сорвётся, пользователь
    // запросит письмо повторно, а причина останется в логах.
    mailer
      .sendVerificationEmail({ to: email, username, token: verification.token })
      .catch((err) => console.error('[auth] письмо при регистрации не ушло:', err.message));

    return res.status(201).json({
      requiresVerification: true,
      email,
      message: 'Мы отправили письмо со ссылкой для подтверждения адреса',
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = String(req.body.email).trim().toLowerCase();
    const { password } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .select(`${USER_FIELDS}, password_hash`)
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    // Одинаковый ответ для несуществующего email и неверного пароля.
    const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !passwordOk) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    if (user.is_banned) {
      return res.status(403).json({ message: 'Ваш аккаунт заблокирован' });
    }

    if ((await verificationRequired()) && !user.email_verified) {
      return res.status(403).json({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Подтвердите адрес почты — мы отправили вам письмо со ссылкой',
      });
    }

    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify-email — переход по ссылке из письма.
async function verifyEmail(req, res, next) {
  try {
    const hash = hashToken(req.body.token);

    const { data: user, error } = await supabase
      .from('users')
      .select(`${USER_FIELDS}, verification_expires_at`)
      .eq('verification_token_hash', hash)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(400).json({
        message: 'Ссылка недействительна или уже использована',
      });
    }

    if (user.verification_expires_at && new Date(user.verification_expires_at) < new Date()) {
      return res.status(400).json({
        code: 'TOKEN_EXPIRED',
        message: 'Срок действия ссылки истёк. Запросите письмо повторно.',
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token_hash: null,
        verification_expires_at: null,
      })
      .eq('id', user.id)
      .select(`${USER_FIELDS}`)
      .single();

    if (updateError) throw updateError;

    if (updated.is_banned) {
      return res.status(403).json({ message: 'Ваш аккаунт заблокирован' });
    }

    // Подтвердил почту — сразу впускаем, второй раз логиниться не нужно.
    res.json({ token: signToken(updated), user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/resend-verification — повторная отправка письма.
async function resendVerification(req, res, next) {
  try {
    const email = String(req.body.email).trim().toLowerCase();

    // Ответ одинаковый в любом случае: перебором нельзя узнать,
    // зарегистрирован ли адрес.
    const genericResponse = {
      message: 'Если аккаунт с таким адресом существует и не подтверждён, письмо отправлено',
    };

    if (!(await verificationRequired())) {
      return res.json(genericResponse);
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, email_verified, verification_sent_at')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (!user || user.email_verified) {
      return res.json(genericResponse);
    }

    const lastSent = user.verification_sent_at ? new Date(user.verification_sent_at).getTime() : 0;
    if (Date.now() - lastSent < RESEND_COOLDOWN_MS) {
      return res.status(429).json({
        message: 'Письмо уже отправлено. Повторить можно через минуту.',
      });
    }

    const verification = createVerificationToken();

    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_token_hash: verification.hash,
        verification_expires_at: verification.expiresAt,
        verification_sent_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    mailer
      .sendVerificationEmail({ to: user.email, username: user.username, token: verification.token })
      .catch((err) => console.error('[auth] повторное письмо не ушло:', err.message));

    res.json(genericResponse);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/auth/profile — имя и аватар пользователя.
async function updateProfile(req, res, next) {
  try {
    const patch = {};

    if (req.body.username !== undefined) {
      const username = String(req.body.username).trim();

      const { data: taken, error: lookupError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', req.user.id)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (taken) {
        return res.status(409).json({ message: 'Это имя пользователя уже занято' });
      }

      patch.username = username;
    }

    // Пустая строка — осознанное «убрать аватар», поэтому пишем null.
    if (req.body.avatar_url !== undefined) {
      const value = String(req.body.avatar_url).trim();
      patch.avatar_url = value || null;
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: 'Не переданы поля для обновления' });
    }

    const { data, error } = await supabase
      .from('users')
      .update(patch)
      .eq('id', req.user.id)
      .select(USER_FIELDS)
      .single();

    if (error) throw error;
    res.json({ user: publicUser(data) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  updateProfile,
  me,
  publicUser,
};
