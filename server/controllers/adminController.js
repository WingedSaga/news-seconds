const { supabase } = require('../db/supabase');
const { LIST_SELECT } = require('./articlesController');
const { USER_FIELDS } = require('../middleware/authMiddleware');

// GET /api/admin/stats
async function stats(_req, res, next) {
  try {
    const [usersRes, pendingRes, articlesRes, viewsRes, commentsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('articles').select('id', { count: 'exact', head: true }),
      supabase.from('articles').select('views'),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
    ]);

    const failed = [usersRes, pendingRes, articlesRes, viewsRes, commentsRes].find((r) => r.error);
    if (failed) throw failed.error;

    const totalViews = (viewsRes.data || []).reduce((sum, row) => sum + (row.views || 0), 0);

    res.json({
      totalUsers: usersRes.count || 0,
      pendingArticles: pendingRes.count || 0,
      totalArticles: articlesRes.count || 0,
      totalViews,
      totalComments: commentsRes.count || 0,
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
    res.json({ item: data });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/articles/:id
async function updateArticle(req, res, next) {
  try {
    const patch = {};
    for (const field of ['title', 'content', 'category', 'image_url', 'status']) {
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

module.exports = {
  stats,
  listArticles,
  updateArticleStatus,
  updateArticle,
  deleteArticle,
  listUsers,
  updateUserRole,
  updateUserBan,
};
