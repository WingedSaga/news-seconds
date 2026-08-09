import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, FilePlus2 } from 'lucide-react';
import api from '../api/axios';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { CATEGORY_LABELS, STATUS_CLASSES, STATUS_LABELS, excerpt, formatRelativeDate } from '../utils/format';

export default function MyArticles() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api
      .get('/articles/mine')
      .then(({ data }) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">Мои новости</h1>
          <p className="text-sm text-neutral-500">Статус ваших материалов на модерации.</p>
        </div>
        <Link to="/submit" className="btn-primary">
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          Предложить новость
        </Link>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        !error && (
          <EmptyState
            title="Вы ещё ничего не отправляли"
            description="Предложите свою первую новость, анекдот или погодную сводку."
          />
        )
      ) : (
        <ul className="space-y-3">
          {items.map((article) => (
            <li key={article.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="pill-accent">{CATEGORY_LABELS[article.category]}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASSES[article.status]}`}>
                    {STATUS_LABELS[article.status]}
                  </span>
                </div>
                <h2 className="truncate text-base font-bold text-neutral-900">
                  {article.status === 'approved' ? (
                    <Link to={`/article/${article.id}`} className="hover:text-brand">
                      {article.title}
                    </Link>
                  ) : (
                    article.title
                  )}
                </h2>
                <p className="text-sm text-neutral-500">{excerpt(article.content, 120)}</p>
                {article.status === 'rejected' && article.moderation_note && (
                  <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <span className="font-semibold">Причина отклонения: </span>{article.moderation_note}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-4 text-xs text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatRelativeDate(article.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  {article.views}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
