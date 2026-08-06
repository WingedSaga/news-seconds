import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import SearchBar from '../../components/SearchBar';
import Avatar from '../../components/Avatar';
import { excerpt, formatRelativeDate } from '../../utils/format';

export default function AdminComments() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .get('/admin/comments', { params: debounced ? { search: debounced } : {} })
      .then(({ data }) => {
        if (!cancelled) setItems(data.items);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debounced, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const remove = async (comment) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Удалить комментарий? Действие необратимо.')) return;

    setBusyId(comment.id);
    setError('');
    try {
      await api.delete(`/admin/comments/${comment.id}`);
      setItems((prev) => prev.filter((item) => item.id !== comment.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Комментарии</h1>
        <p className="text-sm text-neutral-500">Всё, что читатели пишут под материалами.</p>
      </div>

      <div className="sm:max-w-sm">
        <SearchBar value={search} onChange={setSearch} placeholder="Поиск по тексту..." />
      </div>

      <ErrorMessage message={error} onRetry={reload} />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        !error && (
          <EmptyState
            title="Комментариев не найдено"
            description="Измените поисковый запрос или дождитесь активности читателей."
            icon={MessageSquare}
          />
        )
      ) : (
        <ul className="space-y-3">
          {items.map((comment) => (
            <li key={comment.id} className="card space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar user={comment.author} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-800">
                      {comment.author?.username || 'Аноним'}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {formatRelativeDate(comment.created_at)}
                      {comment.article && (
                        <>
                          {' · '}
                          <Link
                            to={`/article/${comment.article.id}`}
                            className="hover:text-brand"
                          >
                            {excerpt(comment.article.title, 50)}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => remove(comment)}
                  disabled={busyId === comment.id}
                  className="shrink-0 rounded p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Удалить комментарий"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <p className="whitespace-pre-wrap text-sm text-neutral-700">{comment.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
