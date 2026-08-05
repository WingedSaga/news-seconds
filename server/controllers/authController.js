const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../db/supabase');
const { USER_FIELDS } = require('../middleware/authMiddleware');

const SALT_ROUNDS = 10;

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
    created_at: user.created_at,
  };
}

async function register(req, res, next) {
  try {
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

    const { data: created, error: insertError } = await supabase
      .from('users')
      .insert({ username, email, password_hash, role: 'user' })
      .select(USER_FIELDS)
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({ token: signToken(created), user: publicUser(created) });
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

    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

module.exports = { register, login, me, publicUser };
