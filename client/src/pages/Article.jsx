import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, Clock, CornerDownRight, Eye, Flag, Maximize2, MessageSquare, Pencil, Reply, Send, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import Lightbox from '../components/Lightbox';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import { CATEGORY_LABELS, STATUS_CLASSES, STATUS_LABELS, formatDateTime, formatRelativeDate, formatViews } from '../utils/format';

// Галерея: крупный кадр и полоса миниатюр под ним.
function Gallery({ images, title }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (images.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Кадр обрезан под общую высоту, поэтому по нажатию показываем
          его целиком поверх страницы. */}
      <button
        type="button"
        onClick={() => setZoomed(true)}
        className="group relative block w-full cursor-zoom-in"
        aria-label="Открыть изображение на весь экран"
      >
        <img
          src={images[active]}
          alt={`${title} — изображение ${active + 1}`}
          className="aspect-[16/9] w-full object-cover"
        />
        <span className="absolute bottom-3 right-3 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>

      {zoomed && <Lightbox images={images} index={active} onClose={() => setZoomed(false)} />}

      {images.length > 1 && (
        <div className="flex flex-wrap gap-2 px-5 pt-2 sm:px-8">
          {images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Показать изображение ${index + 1}`}
              aria-current={index === active}
              className={`overflow-hidden rounded border-2 transition-colors ${
                index === active ? 'border-brand' : 'border-transparent hover:border-neutral-300'
              }`}
            >
              <img src={url} alt="" className="h-14 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Один комментарий: и корневой, и ответ. Разница только в размере
// аватара — отступ и линия слева уже говорят, что это ответ.
function CommentBody({ comment, canDelete, onDelete, canReply, onReply, onReport, compact = false }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Avatar user={comment.author} size={compact ? 'sm' : 'md'} />
          <div>
            <p className="text-sm font-semibold text-neutral-800">
              {comment.author?.username || 'Аноним'}
            </p>
            <p className="text-xs text-neutral-400">{formatRelativeDate(comment.created_at)}</p>
          </div>
        </div>

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Удалить комментарий"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{comment.text}</p>

      {canReply && (
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={onReply} className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 transition-colors hover:text-brand">
            <Reply className="h-3.5 w-3.5" aria-hidden="true" />
            Ответить
          </button>
          <button type="button" onClick={onReport} className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 transition-colors hover:text-red-600">
            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            Пожаловаться
          </button>
        </div>
      )}
    </>
  );
}

// Форма ответа раскрывается под своим комментарием и всегда одна.
function ReplyForm({ value, onChange, onSubmit, onCancel, sending, error, to }) {
  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2 rounded-lg bg-neutral-50 p-3">
      <p className="flex items-center gap-1.5 text-xs text-neutral-500">
        <CornerDownRight className="h-3.5 w-3.5" aria-hidden="true" />
        Ответ пользователю <span className="font-semibold text-neutral-700">{to || 'Аноним'}</span>
      </p>

      <textarea
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={1000}
        placeholder="Ваш ответ..."
        aria-label="Текст ответа"
        className="field resize-y bg-white"
        autoFocus
      />

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost py-1.5 text-xs">
          Отмена
        </button>
        <button type="submit" className="btn-primary py-1.5 text-xs" disabled={sending}>
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          {sending ? 'Отправляем...' : 'Ответить'}
        </button>
      </div>

      <ErrorMessage message={error} />
    </form>
  );
}

export default function Article() {
  const { id } = useParams();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [article, setArticle] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [sending, setSending] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [reportMessage, setReportMessage] = useState('');

  // Ответ пишется прямо под тем комментарием, на который отвечают,
  // поэтому открытая форма всегда ровно одна.
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState('');
  const [replySending, setReplySending] = useState(false);

  const loadArticle = useCallback(() => {
    setLoading(true);
    setError('');

    return api
      .get(`/articles/${id}`)
      .then(({ data }) => {
        setArticle(data.item);
        setBookmarked(data.bookmarked);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const loadComments = useCallback(() => {
    setCommentsLoading(true);
    return api
      .get(`/comments/article/${id}`)
      .then(({ data }) => setComments(data.items))
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    loadArticle();
    loadComments();
  }, [loadArticle, loadComments]);

  const toggleBookmark = async () => {
    setBookmarkBusy(true);
    try {
      const { data } = await api.post(`/articles/${id}/bookmark`);
      setBookmarked(data.bookmarked);
    } catch (err) {
      setError(err.message);
    } finally {
      setBookmarkBusy(false);
    }
  };

  // Общая отправка: отличие ответа от обычного комментария — только
  // в parent_id, поэтому проверки и запрос держим в одном месте.
  const sendComment = async (text, parentId) => {
    const value = text.trim();
    if (value.length < 2) throw new Error('Комментарий должен быть не короче 2 символов');
    if (value.length > 1000) throw new Error('Комментарий не должен превышать 1000 символов');

    const { data } = await api.post('/comments', {
      article_id: id,
      text: value,
      ...(parentId ? { parent_id: parentId } : {}),
    });

    setComments((prev) => [data.item, ...prev]);
  };

  const submitComment = async (event) => {
    event.preventDefault();
    setCommentError('');
    setSending(true);

    try {
      await sendComment(commentText);
      setCommentText('');
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setSending(false);
    }
  };

  const submitReply = async (event, parentId) => {
    event.preventDefault();
    setReplyError('');
    setReplySending(true);

    try {
      await sendComment(replyText, parentId);
      setReplyText('');
      setReplyTo(null);
    } catch (err) {
      setReplyError(err.message);
    } finally {
      setReplySending(false);
    }
  };

  const openReply = (commentId) => {
    setReplyTo(commentId);
    setReplyText('');
    setReplyError('');
  };

  const removeComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      // В базе ответы уходят каскадом, поэтому убираем их и здесь —
      // иначе ветка останется висеть без начала.
      setComments((prev) => {
        const doomed = new Set([commentId]);
        let grew = true;

        while (grew) {
          grew = false;
          for (const comment of prev) {
            if (!doomed.has(comment.id) && doomed.has(comment.parent_id)) {
              doomed.add(comment.id);
              grew = true;
            }
          }
        }

        return prev.filter((comment) => !doomed.has(comment.id));
      });
      if (replyTo === commentId) setReplyTo(null);
    } catch (err) {
      setCommentError(err.message);
    }
  };

  const report = async (targetType, targetId) => {
    // Короткий запрос причины оставляет жалобу полезной для модератора, но не мешает
    // быстро пожаловаться на очевидное нарушение.
    const reason = window.prompt('Укажите причину жалобы (необязательно):');
    if (reason === null) return;

    setReportMessage('');
    try {
      const { data } = await api.post('/reports', { target_type: targetType, target_id: targetId, reason });
      setReportMessage(data.message);
    } catch (err) {
      setReportMessage(err.message);
    }
  };

  // Плоский список от сервера раскладываем в ветки: сверху свежие
  // комментарии, ответы под своим — в порядке появления.
  const threads = useMemo(() => {
    const byId = new Map(comments.map((comment) => [comment.id, comment]));

    // Ветку сворачиваем сами, не полагаясь на сервер: если ответ пришёл
    // прикреплённым к другому ответу, он всё равно должен попасть под
    // начало разговора, а не потеряться.
    const rootOf = (comment) => {
      let current = comment;
      const seen = new Set([comment.id]);

      while (current.parent_id && byId.has(current.parent_id)) {
        const parent = byId.get(current.parent_id);
        if (seen.has(parent.id)) break;
        seen.add(parent.id);
        current = parent;
      }

      return current;
    };

    const byRoot = new Map();
    const roots = [];

    for (const comment of comments) {
      const root = rootOf(comment);
      // Родитель мог быть удалён: тогда ответ показываем сам по себе,
      // молча прятать чужой текст нельзя.
      if (root.id === comment.id) {
        roots.push(comment);
        continue;
      }

      const list = byRoot.get(root.id) || [];
      list.push(comment);
      byRoot.set(root.id, list);
    }

    for (const list of byRoot.values()) {
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    return roots.map((root) => ({ root, replies: byRoot.get(root.id) || [] }));
  }, [comments]);

  if (loading) return <Loader label="Загружаем статью..." />;

  if (error && !article) {
    return (
      <div className="space-y-4">
        <ErrorMessage message={error} onRetry={loadArticle} />
        <Link to="/" className="btn-outline w-fit">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          На главную
        </Link>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-hover">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Ко всем новостям
      </Link>

      <ErrorMessage message={error} />

      <article className="card overflow-hidden">
        <Gallery
          images={
            article.image_urls?.length > 0
              ? article.image_urls
              : article.image_url
                ? [article.image_url]
                : []
          }
          title={article.title}
        />

        <div className="space-y-5 p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">{CATEGORY_LABELS[article.category] || article.category}</span>
            {article.status !== 'approved' && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[article.status]}`}>
                {STATUS_LABELS[article.status]}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 font-serif text-[1.75rem] font-black leading-[1.15] text-ink sm:text-5xl sm:leading-[1.1]">
              {article.title}
            </h1>

            {/* Правка материала живёт в панели: там же лежат картинки и статус. */}
            {isAdmin && (
              <Link
                to={`/admin/articles?edit=${article.id}`}
                className="btn-outline shrink-0 text-xs"
                title="Редактировать материал"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Изменить
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-neutral-200 pb-4 text-sm text-neutral-500">
            <span className="flex items-center gap-2">
              <Avatar user={article.author} size="md" />
              <span className="font-semibold text-neutral-700">{article.author?.username || 'Аноним'}</span>
            </span>
            <span className="flex items-center gap-1.5" title={formatDateTime(article.created_at)}>
              <Clock className="h-4 w-4" aria-hidden="true" />
              {formatRelativeDate(article.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" aria-hidden="true" />
              {formatViews(article.views)}
            </span>
          </div>

          {article.media_url && (
            <figure className="space-y-2">
              {article.media_type === 'video' ? (
                <video
                  src={article.media_url}
                  controls
                  preload="metadata"
                  className="w-full rounded-md border border-neutral-200 bg-black"
                />
              ) : (
                <audio src={article.media_url} controls preload="metadata" className="w-full" />
              )}
              <figcaption className="text-xs text-neutral-400">
                {article.media_type === 'video' ? 'Видео к материалу' : 'Аудиозапись к материалу'}
              </figcaption>
            </figure>
          )}

          <div className="prose-news whitespace-pre-wrap">{article.content}</div>

          {isAuthenticated && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-200 pt-4">
              <button type="button" onClick={() => report('article', article.id)} className="btn-ghost text-xs">
                <Flag className="h-4 w-4" aria-hidden="true" />
                Пожаловаться
              </button>
              <button type="button" onClick={toggleBookmark} disabled={bookmarkBusy} className="btn-outline">
                {bookmarked ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
                    В закладках
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" aria-hidden="true" />
                    В закладки
                  </>
                )}
              </button>
            </div>
          )}
          {reportMessage && <p className="text-right text-xs text-neutral-500">{reportMessage}</p>}
        </div>
      </article>

      <section aria-labelledby="comments-heading" className="space-y-5">
        <h2 id="comments-heading" className="flex items-center gap-2 text-xl font-extrabold text-neutral-900">
          <MessageSquare className="h-5 w-5 text-brand" aria-hidden="true" />
          Комментарии ({comments.length})
        </h2>

        {isAuthenticated ? (
          <form onSubmit={submitComment} className="card space-y-3 p-4">
            <label htmlFor="comment" className="text-sm font-semibold text-neutral-700">
              Ваш комментарий
            </label>
            <textarea
              id="comment"
              rows={3}
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              maxLength={1000}
              placeholder="Поделитесь мнением..."
              className="field resize-y"
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-400">{commentText.length} / 1000</span>
              <button type="submit" className="btn-primary" disabled={sending}>
                <Send className="h-4 w-4" aria-hidden="true" />
                {sending ? 'Отправляем...' : 'Отправить'}
              </button>
            </div>
            <ErrorMessage message={commentError} />
          </form>
        ) : (
          <p className="rounded-md border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            Чтобы оставить комментарий,{' '}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              войдите
            </Link>{' '}
            или{' '}
            <Link to="/register" className="font-semibold text-brand hover:underline">
              зарегистрируйтесь
            </Link>
            .
          </p>
        )}

        {commentsLoading ? (
          <Loader label="Загружаем комментарии..." />
        ) : comments.length === 0 ? (
          <EmptyState
            title="Комментариев пока нет"
            description="Станьте первым, кто выскажется об этой публикации."
            icon={MessageSquare}
          />
        ) : (
          <ul className="space-y-4">
            {threads.map(({ root, replies }) => (
              <li key={root.id} className="card p-4">
                <CommentBody
                  comment={root}
                  canDelete={isAdmin || root.user_id === user?.id}
                  onDelete={() => removeComment(root.id)}
                  canReply={isAuthenticated}
                  onReply={() => openReply(root.id)}
                  onReport={() => report('comment', root.id)}
                />

                {replyTo === root.id && (
                  <ReplyForm
                    value={replyText}
                    onChange={setReplyText}
                    onSubmit={(event) => submitReply(event, root.id)}
                    onCancel={() => setReplyTo(null)}
                    sending={replySending}
                    error={replyError}
                    to={root.author?.username}
                  />
                )}

                {replies.length > 0 && (
                  <ul className="mt-4 space-y-4 border-l-2 border-neutral-200 pl-4">
                    {replies.map((reply) => (
                      <li key={reply.id}>
                        <CommentBody
                          comment={reply}
                          canDelete={isAdmin || reply.user_id === user?.id}
                          onDelete={() => removeComment(reply.id)}
                          canReply={isAuthenticated}
                          onReply={() => openReply(reply.id)}
                          onReport={() => report('comment', reply.id)}
                          compact
                        />

                        {replyTo === reply.id && (
                          <ReplyForm
                            value={replyText}
                            onChange={setReplyText}
                            onSubmit={(event) => submitReply(event, reply.id)}
                            onCancel={() => setReplyTo(null)}
                            sending={replySending}
                            error={replyError}
                            to={reply.author?.username}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
