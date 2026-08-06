const { supabase } = require('../db/supabase');
const { LIST_SELECT } = require('./articlesController');
const { USER_FIELDS } = require('../middleware/authMiddleware');
const settingsService = require('../services/settings');
const mailer = require('../services/mailer');
const audit = require('../services/audit');
const { loadMessages, TICKET_SELECT } = require('./supportController');

// GET /api/admin/settings
async function getSettings(_req, res, next) {
  try {
    const values = await settingsService.getSettings({ force: true });
    res.json({
      settings: values,
      // Переключатель подтверждения почты бессмыслен без настроенной отправки,
      // поэтому панель показывает, доступна ли она вообще.
      mail: { available: mailer.isEnabled, provider: mailer.provider },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/settings
async function updateSettings(req, res, next) {
  try {
    const patch = {};
    for (const key of settingsService.EDITABLE) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: 'Не переданы настройки для изменения' });
    }

    if (patch.email_verification && !mailer.isEnabled) {
      return res.status(400).json({
        message: 'Нельзя включить подтверждение почты: не настроен сервис отправки писем',
      });
    }

    const values = await settingsService.updateSettings(patch);
    await audit.logAction(req.user, 'settings.update', { details: patch });
    res.json({ settings: values });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/users/promote — назначение администратора по адресу почты.
async function promoteByEmail(req, res, next) {
  try {
    const email = String(req.body.email).trim().toLowerCase();

    const { data, error } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', email)
      .select(USER_FIELDS)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({
        message: 'Пользователь с таким адресом не найден — сначала он должен зарегистрироваться',
      });
    }

    await audit.logAction(req.user, 'user.promote', {
      targetType: 'user',
      targetId: data.id,
      details: { username: data.username, email: data.email },
    });

    res.json({ item: data });
  } catch (err) {
    next(err);
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

// GET /api/admin/stats — сводка для дашборда.
async function stats(_req, res, next) {
  try {
    const weekAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();
    const since = new Date(Date.now() - 13 * DAY_MS);
    since.setHours(0, 0, 0, 0);

    const [
      usersRes,
      newUsersRes,
      bannedRes,
      adminsRes,
      articlesRes,
      commentsRes,
      bookmarksRes,
      openTicketsRes,
      allArticlesRes,
      topRes,
      pendingListRes,
      recentCommentsRes,
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_banned', true),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
      supabase.from('articles').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('bookmarks').select('id', { count: 'exact', head: true }),
      supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'closed'),
      supabase.from('articles').select('status, category, views, created_at'),
      supabase
        .from('articles')
        .select('id, title, views, category')
        .eq('status', 'approved')
        .order('views', { ascending: false })
        .limit(5),
      supabase
        .from('articles')
        .select('id, title, created_at, author:users (username)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('comments')
        .select('id, text, created_at, author:users (username), article:articles (id, title)')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const responses = [
      usersRes,
      newUsersRes,
      bannedRes,
      adminsRes,
      articlesRes,
      commentsRes,
      bookmarksRes,
      openTicketsRes,
      allArticlesRes,
      topRes,
      pendingListRes,
      recentCommentsRes,
    ];
    const failed = responses.find((r) => r.error);
    if (failed) throw failed.error;

    const articles = allArticlesRes.data || [];

    const byStatus = { pending: 0, approved: 0, rejected: 0 };
    const byCategory = { news: 0, joke: 0, weather: 0 };
    let totalViews = 0;

    for (const article of articles) {
      if (article.status in byStatus) byStatus[article.status] += 1;
      if (article.category in byCategory) byCategory[article.category] += 1;
      totalViews += article.views || 0;
    }

    // Публикации по дням за две недели — ряд без пропусков,
    // чтобы на графике были видны и нулевые дни.
    const timeline = [];
    for (let i = 13; i >= 0; i -= 1) {
      const date = new Date(Date.now() - i * DAY_MS);
      timeline.push({ date: dayKey(date), count: 0 });
    }
    const indexByDate = new Map(timeline.map((point, index) => [point.date, index]));

    for (const article of articles) {
      const index = indexByDate.get(dayKey(article.created_at));
      if (index !== undefined) timeline[index].count += 1;
    }

    res.json({
      totalUsers: usersRes.count || 0,
      newUsers: newUsersRes.count || 0,
      bannedUsers: bannedRes.count || 0,
      admins: adminsRes.count || 0,
      totalArticles: articlesRes.count || 0,
      pendingArticles: byStatus.pending,
      approvedArticles: byStatus.approved,
      rejectedArticles: byStatus.rejected,
      totalComments: commentsRes.count || 0,
      totalBookmarks: bookmarksRes.count || 0,
      openTickets: openTicketsRes.count || 0,
      totalViews,
      byCategory,
      timeline,
      topArticles: topRes.data || [],
      latestPending: pendingListRes.data || [],
      latestComments: recentCommentsRes.data || [],
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/articles?status=pending
async function listArticles(req, res, next) {
  try {
    const { status, search } = req.query;

    let query = supabase
      .from('articles')
      .select(LIST_SELECT)
      .order('created_at', { ascending: false })
      .limit(200);

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = query.eq('status', status);
    }
    const term = search ? String(search).replace(/[,()%*\\]/g, ' ').trim() : '';
    if (term) {
      query = query.ilike('title', `%${term}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ items: data || [] });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/articles/:id/status
async function updateArticleStatus(req, res, next) {
  try {
    const { status } = req.body;

    const { data, error } = await supabase
      .from('articles')
      .update({ status })
      .eq('id', req.params.id)
      .select(LIST_SELECT)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    await audit.logAction(req.user, `article.${status}`, {
      targetType: 'article',
      targetId: data.id,
      details: { title: data.title },
    });

    res.json({ item: data });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/articles/:id
async function updateArticle(req, res, next) {
  try {
    const patch = {};
    for (const field of ['title', 'content', 'category', 'image_url', 'image_urls', 'media_url', 'media_type', 'status']) {
      if (req.body[field] !== undefined) {
        patch[field] = req.body[field] === '' ? null : req.body[field];
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: 'Не переданы поля для обновления' });
    }

    const { data, error } = await supabase
      .from('articles')
      .update(patch)
      .eq('id', req.params.id)
      .select(LIST_SELECT)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }
    res.json({ item: data });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/articles/:id
async function deleteArticle(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .delete()
      .eq('id', req.params.id)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    await audit.logAction(req.user, 'article.delete', {
      targetType: 'article',
      targetId: data.id,
    });

    res.json({ message: 'Статья удалена' });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/users
async function listUsers(req, res, next) {
  try {
    const term = req.query.search ? String(req.query.search).replace(/[,()%*\\]/g, ' ').trim() : '';

    let query = supabase
      .from('users')
      .select(USER_FIELDS)
      .order('created_at', { ascending: false })
      .limit(200);

    if (term) {
      query = query.or(`username.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ items: data || [] });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/users/:id/role
async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;

    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Нельзя изменить собственную роль' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select(USER_FIELDS)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    await audit.logAction(req.user, 'user.role', {
      targetType: 'user',
      targetId: data.id,
      details: { username: data.username, role },
    });

    res.json({ item: data });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/users/:id/ban
async function updateUserBan(req, res, next) {
  try {
    const { is_banned } = req.body;

    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Нельзя заблокировать самого себя' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ is_banned })
      .eq('id', req.params.id)
      .select(USER_FIELDS)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    res.json({ item: data });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/comments — все комментарии сайта с поиском.
async function listComments(req, res, next) {
  try {
    const term = req.query.search ? String(req.query.search).replace(/[,()%*\\]/g, ' ').trim() : '';

    let query = supabase
      .from('comments')
      .select('id, text, created_at, author:users (id, username, avatar_url), article:articles (id, title)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (term) query = query.ilike('text', `%${term}%`);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ items: data || [] });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/comments/:id
async function deleteComment(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .delete()
      .eq('id', req.params.id)
      .select('id, text')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Комментарий не найден' });
    }

    await audit.logAction(req.user, 'comment.delete', {
      targetType: 'comment',
      targetId: data.id,
      details: { text: String(data.text).slice(0, 120) },
    });

    res.json({ message: 'Комментарий удалён' });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/articles/bulk — массовые действия над выбранными статьями.
async function bulkArticles(req, res, next) {
  try {
    const { ids, action } = req.body;

    if (action === 'delete') {
      const { data, error } = await supabase.from('articles').delete().in('id', ids).select('id');
      if (error) throw error;

      await audit.logAction(req.user, 'article.bulk_delete', {
        targetType: 'article',
        details: { count: data.length },
      });
      return res.json({ affected: data.length });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';
    const { data, error } = await supabase
      .from('articles')
      .update({ status })
      .in('id', ids)
      .select('id');

    if (error) throw error;

    await audit.logAction(req.user, `article.bulk_${action}`, {
      targetType: 'article',
      details: { count: data.length, status },
    });

    res.json({ affected: data.length, status });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/users/:id — удаление пользователя вместе с его материалами.
async function deleteUser(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Нельзя удалить собственный аккаунт' });
    }

    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.params.id)
      .select('id, username, email')
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    await audit.logAction(req.user, 'user.delete', {
      targetType: 'user',
      targetId: data.id,
      details: { username: data.username, email: data.email },
    });

    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/logs — журнал действий администраторов.
async function listLogs(_req, res, next) {
  try {
    res.json({ items: await audit.listActions({ limit: 150 }) });
  } catch (err) {
    next(err);
  }
}

function toCsv(rows, columns) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const header = columns.map((column) => escape(column.label)).join(';');
  const body = rows.map((row) => columns.map((column) => escape(row[column.key])).join(';'));
  // BOM: без него Excel открывает кириллицу в CSV нечитаемой.
  return `﻿${[header, ...body].join('\n')}`;
}

// GET /api/admin/export/:entity — выгрузка в CSV.
async function exportCsv(req, res, next) {
  try {
    const { entity } = req.params;

    if (entity === 'users') {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, role, is_banned, email_verified, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const csv = toCsv(data || [], [
        { key: 'id', label: 'ID' },
        { key: 'username', label: 'Имя' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Роль' },
        { key: 'is_banned', label: 'Заблокирован' },
        { key: 'email_verified', label: 'Почта подтверждена' },
        { key: 'created_at', label: 'Регистрация' },
      ]);

      await audit.logAction(req.user, 'export.users', { details: { count: (data || []).length } });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
      return res.send(csv);
    }

    if (entity === 'articles') {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, category, status, views, created_at, author:users (username)')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data || []).map((row) => ({ ...row, author: row.author?.username || '' }));
      const csv = toCsv(rows, [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Заголовок' },
        { key: 'category', label: 'Категория' },
        { key: 'status', label: 'Статус' },
        { key: 'views', label: 'Просмотры' },
        { key: 'author', label: 'Автор' },
        { key: 'created_at', label: 'Создано' },
      ]);

      await audit.logAction(req.user, 'export.articles', { details: { count: rows.length } });
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="articles.csv"');
      return res.send(csv);
    }

    return res.status(400).json({ message: 'Неизвестный тип выгрузки' });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/support — все обращения, по умолчанию свежие сверху.
async function listTickets(req, res, next) {
  try {
    const { status } = req.query;

    let query = supabase
      .from('support_tickets')
      .select(TICKET_SELECT)
      .order('updated_at', { ascending: false })
      .limit(200);

    if (status && ['new', 'in_progress', 'closed'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const items = await Promise.all(
      (data || []).map(async (ticket) => ({ ...ticket, messages: await loadMessages(ticket.id) }))
    );

    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/support/:id/status
async function updateTicketStatus(req, res, next) {
  try {
    const { status } = req.body;

    const { data, error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select(TICKET_SELECT)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: 'Обращение не найдено' });
    }

    await audit.logAction(req.user, 'support.status', {
      targetType: 'ticket',
      targetId: data.id,
      details: { subject: data.subject, status },
    });

    res.json({ item: { ...data, messages: await loadMessages(data.id) } });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/support/:id/messages — ответ редакции.
async function answerTicket(req, res, next) {
  try {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select('id, subject')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!ticket) {
      return res.status(404).json({ message: 'Обращение не найдено' });
    }

    const { error: messageError } = await supabase.from('support_messages').insert({
      ticket_id: ticket.id,
      author_id: req.user.id,
      author_name: req.user.username,
      from_staff: true,
      text: String(req.body.text).trim(),
    });

    if (messageError) throw messageError;

    // Ответ переводит новое обращение в работу автоматически.
    const { data: updated, error: updateError } = await supabase
      .from('support_tickets')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', ticket.id)
      .select(TICKET_SELECT)
      .single();

    if (updateError) throw updateError;

    await audit.logAction(req.user, 'support.reply', {
      targetType: 'ticket',
      targetId: ticket.id,
      details: { subject: ticket.subject },
    });

    res.status(201).json({ item: { ...updated, messages: await loadMessages(ticket.id) } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listTickets,
  updateTicketStatus,
  answerTicket,
  listComments,
  deleteComment,
  bulkArticles,
  deleteUser,
  listLogs,
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
  updateUserBan,
};
