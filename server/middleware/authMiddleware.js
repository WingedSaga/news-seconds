const jwt = require('jsonwebtoken');
const { supabase } = require('../db/supabase');
const { getSubscriptionEntitlement } = require('../services/subscriptions');

const USER_FIELDS = 'id, username, email, role, avatar_url, is_banned, email_verified, created_at';

function readToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

async function loadUserFromToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const { data, error } = await supabase
    .from('users')
    .select(USER_FIELDS)
    .eq('id', payload.sub)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return { ...data, subscription: await getSubscriptionEntitlement(data.id) };
}

// Требует валидный JWT. Отклоняет забаненных пользователей.
async function authMiddleware(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  try {
    const user = await loadUserFromToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }
    if (user.is_banned) {
      return res.status(403).json({ message: 'Ваш аккаунт заблокирован' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Срок действия сессии истёк' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Недействительный токен' });
    }
    next(err);
  }
}

// Не требует авторизации, но подставляет req.user, если токен передан и валиден.
async function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();

  try {
    const user = await loadUserFromToken(token);
    if (user && !user.is_banned) req.user = user;
  } catch {
    // Некорректный токен для публичного маршрута — просто игнорируем.
  }
  next();
}

module.exports = { authMiddleware, optionalAuth, USER_FIELDS };
