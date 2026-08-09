const { supabase } = require('../db/supabase');
const settings = require('../services/settings');
const { commentSelect, repliesEnabled } = require('../db/schemaState');

// GET /api/comments/article/:articleId
async function listComments(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(commentSelect())
      .eq('article_id', req.params.articleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ items: data || [] });
  } catch (err) {
    next(err);
  }
}

// POST /api/comments
async function createComment(req, res, next) {
  try {
    if (!(await settings.getSetting('comments_enabled'))) {
      return res.status(403).json({ message: 'Комментарии на сайте отключены' });
    }

    const { article_id, text, parent_id } = req.body;

    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, status')
      .eq('id', article_id)
      .maybeSingle();

    if (articleError) throw articleError;
    if (!article || article.status !== 'approved') {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    const payload = { article_id, user_id: req.user.id, text: String(text).trim() };

    if (parent_id && repliesEnabled()) {
      const { data: parent, error: parentError } = await supabase
        .from('comments')
        .select('id, article_id, parent_id')
        .eq('id', parent_id)
        .maybeSingle();

      if (parentError) throw parentError;
      if (!parent || parent.article_id !== article_id) {
        return res.status(404).json({ message: 'Комментарий, на который вы отвечаете, не найден' });
      }

      // Ответ на ответ уходит в начало той же ветки: два уровня читаются,
      // третий на телефоне превращается в лесенку из отступов.
      payload.parent_id = parent.parent_id || parent.id;
    }

    const { data, error } = await supabase
      .from('comments')
      .insert(payload)
      .select(commentSelect())
      .single();

    if (error) throw error;
    res.status(201).json({ item: data });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/comments/:id — удалить может автор комментария или администратор.
async function deleteComment(req, res, next) {
  try {
    const { data: comment, error } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!comment) {
      return res.status(404).json({ message: 'Комментарий не найден' });
    }

    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Нельзя удалить чужой комментарий' });
    }

    const { error: deleteError } = await supabase.from('comments').delete().eq('id', comment.id);
    if (deleteError) throw deleteError;

    res.json({ message: 'Комментарий удалён' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listComments, createComment, deleteComment };
