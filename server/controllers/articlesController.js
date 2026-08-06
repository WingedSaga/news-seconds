const { supabase } = require('../db/supabase');
const settings = require('../services/settings');

const AUTHOR_SELECT = 'author:users (id, username, avatar_url)';
const LIST_SELECT = `id, title, content, category, image_url, image_urls, media_url, media_type, author_id, status, views, created_at, ${AUTHOR_SELECT}`;

// В значениях фильтров PostgREST спецсимволы ломают выражение `or`, убираем их.
function sanitizeSearch(value) {
  return String(value).replace(/[,()%*\\]/g, ' ').trim();
}

// Ограничение на число картинок в одной новости.
const MAX_IMAGES = 5;

function parsePaging(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 9));
  return { page, limit, from: (page - 1) * limit, to: page * limit - 1 };
}

// GET /api/articles — публичный список одобренных статей.
async function listArticles(req, res, next) {
  try {
    const { page, limit, from, to } = parsePaging(req.query);
    const { category, search } = req.query;

    let query = supabase
      .from('articles')
      .select(LIST_SELECT, { count: 'exact' })
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (category && ['news', 'joke', 'weather'].includes(category)) {
      query = query.eq('category', category);
    }

    const term = search ? sanitizeSearch(search) : '';
    if (term) {
      query = query.or(`title.ilike.%${term}%,content.ilike.%${term}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const total = count || 0;
    res.json({
      items: data || [],
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: to + 1 < total,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/articles/featured — самая свежая одобренная новость для героя-блока.
async function featuredArticle(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select(LIST_SELECT)
      .eq('status', 'approved')
      .eq('category', 'news')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    res.json({ item: data || null });
  } catch (err) {
    next(err);
  }
}

// GET /api/articles/ticker — заголовки для бегущей строки.
async function tickerArticles(_req, res, next) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json({ items: data || [] });
  } catch (err) {
    next(err);
  }
}

// GET /api/articles/mine — статьи текущего пользователя со всеми статусами.
async function myArticles(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select(LIST_SELECT)
      .eq('author_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ items: data || [] });
  } catch (err) {
    next(err);
  }
}

// GET /api/articles/:id — одна статья, просмотр увеличивает счётчик.
async function getArticle(req, res, next) {
  try {
    const { data: article, error } = await supabase
      .from('articles')
      .select(LIST_SELECT)
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!article) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    // Неодобренную статью видит только автор или администратор.
    const isOwner = req.user && req.user.id === article.author_id;
    const isAdmin = req.user && req.user.role === 'admin';
    if (article.status !== 'approved' && !isOwner && !isAdmin) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    if (article.status === 'approved') {
      const { error: viewsError } = await supabase.rpc('increment_article_views', {
        article_id: article.id,
      });
      if (!viewsError) article.views += 1;
    }

    let bookmarked = false;
    if (req.user) {
      const { data: bookmark } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', req.user.id)
        .eq('article_id', article.id)
        .maybeSingle();
      bookmarked = Boolean(bookmark);
    }

    res.json({ item: article, bookmarked });
  } catch (err) {
    next(err);
  }
}

// POST /api/articles — отправка новости на модерацию.
async function createArticle(req, res, next) {
  try {
    const { title, content, category, image_url, image_urls, media_url, media_type } = req.body;

    // Галерея — источник истины, image_url остаётся обложкой для карточек
    // и лент, чтобы им не приходилось разбирать массив.
    const gallery = Array.isArray(image_urls)
      ? image_urls.map((url) => String(url).trim()).filter(Boolean).slice(0, MAX_IMAGES)
      : [];
    const cover = gallery[0] || (image_url ? String(image_url).trim() : null);
    // При включённом автоодобрении материал публикуется без модерации.
    const status = (await settings.getSetting('auto_approve_articles')) ? 'approved' : 'pending';

    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: String(title).trim(),
        content: String(content).trim(),
        category,
        image_url: cover,
        image_urls: gallery.length > 0 ? gallery : cover ? [cover] : [],
        media_url: media_url ? String(media_url).trim() : null,
        media_type: media_url ? media_type : null,
        author_id: req.user.id,
        status,
      })
      .select(LIST_SELECT)
      .single();

    if (error) throw error;
    res.status(201).json({ item: data });
  } catch (err) {
    next(err);
  }
}

// GET /api/articles/bookmarks/list — закладки текущего пользователя.
async function listBookmarks(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`id, created_at, article:articles (${LIST_SELECT})`)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const items = (data || []).map((row) => row.article).filter((a) => a && a.status === 'approved');
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

// POST /api/articles/:id/bookmark — переключение закладки.
async function toggleBookmark(req, res, next) {
  try {
    const articleId = req.params.id;

    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id')
      .eq('id', articleId)
      .maybeSingle();

    if (articleError) throw articleError;
    if (!article) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    const { data: existing, error: findError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('article_id', articleId)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const { error } = await supabase.from('bookmarks').delete().eq('id', existing.id);
      if (error) throw error;
      return res.json({ bookmarked: false });
    }

    const { error } = await supabase
      .from('bookmarks')
      .insert({ user_id: req.user.id, article_id: articleId });
    if (error) throw error;

    res.status(201).json({ bookmarked: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listArticles,
  featuredArticle,
  tickerArticles,
  myArticles,
  getArticle,
  createArticle,
  listBookmarks,
  toggleBookmark,
  LIST_SELECT,
  MAX_IMAGES,
};
