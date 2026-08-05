import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, BookmarkCheck, Clock, Eye, MessageSquare, Send, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import Avatar from '../components/Avatar';
import { CATEGORY_LABELS, STATUS_CLASSES, STATUS_LABELS, formatDateTime, formatRelativeDate, formatViews } from '../utils/format';

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

  const submitComment = async (event) => {
    event.preventDefault();
    setCommentError('');

    const text = commentText.trim();
    if (text.length < 2) {
      setCommentError('Комментарий должен быть не короче 2 символов');
      return;
    }
    if (text.length > 1000) {
      setCommentError('Комментарий не должен превышать 1000 символов');
      return;
    }

    setSending(true);
    try {
      const { data } = await api.post('/comments', { article_id: id, text });
      setComments((prev) => [data.item, ...prev]);
      setCommentText('');
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setSending(false);
    }
  };

  const removeComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      setCommentError(err.message);
    }
  };

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
        {article.image_url && (
          <img src={article.image_url} alt={article.title} className="h-64 w-full object-cover sm:h-80" />
        )}

        <div className="space-y-5 p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill">{CATEGORY_LABELS[article.category] || article.category}</span>
            {article.status !== 'approved' && (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[article.status]}`}>
                {STATUS_LABELS[article.status]}
              </span>
            )}
          </div>

          <h1 className="text-3xl font-extrabold leading-tight text-neutral-900">{article.title}</h1>

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

          <div className="whitespace-pre-wrap text-base leading-relaxed text-neutral-800">{article.content}</div>

          {isAuthenticated && (
            <div className="flex justify-end border-t border-neutral-200 pt-4">
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
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li key={comment.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar user={comment.author} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">
                        {comment.author?.username || 'Аноним'}
                      </p>
                      <p className="text-xs text-neutral-400">{formatRelativeDate(comment.created_at)}</p>
                    </div>
                  </div>

                  {(isAdmin || comment.user_id === user?.id) && (
                    <button
                      type="button"
                      onClick={() => removeComment(comment.id)}
                      className="rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Удалить комментарий"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{comment.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
