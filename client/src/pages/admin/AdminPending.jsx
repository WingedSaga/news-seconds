import { useCallback, useEffect, useState } from 'react';
import { Check, ClipboardList, Clock, Eye, X } from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ArticlePreviewModal from '../../components/ArticlePreviewModal';
import { CATEGORY_LABELS, excerpt, formatRelativeDate } from '../../utils/format';

export default function AdminPending() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api
      .get('/admin/articles', { params: { status: 'pending' } })
      .then(({ data }) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id, status) => {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/admin/articles/${id}/status`, {
        status,
        ...(status === 'rejected' ? { moderation_note: note } : {}),
      });
      setItems((prev) => prev.filter((article) => article.id !== id));
      setPreview(null);
      setRejecting(null);
      setNote('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Модерация</h1>
        <p className="text-sm text-neutral-500">Материалы, ожидающие решения редакции.</p>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        !error && (
          <EmptyState
            title="Очередь пуста"
            description="Все присланные материалы обработаны."
            icon={ClipboardList}
          />
        )
      ) : (
        <ul className="space-y-3">
          {items.map((article) => (
            <li key={article.id} className="card space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill">{CATEGORY_LABELS[article.category]}</span>
                <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatRelativeDate(article.created_at)}
                </span>
                <span className="text-xs text-neutral-500">
                  Автор: {article.author?.username || 'Аноним'}
                </span>
              </div>

              <h2 className="text-lg font-bold text-neutral-900">{article.title}</h2>
              <p className="text-sm text-neutral-600">{excerpt(article.content, 220)}</p>

              <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
                <button type="button" className="btn-ghost" onClick={() => setPreview(article)}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Предпросмотр
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busyId === article.id}
                  onClick={() => decide(article.id, 'approved')}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Одобрить
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  disabled={busyId === article.id}
                  onClick={() => {
                    setRejecting(article.id);
                    setNote('');
                  }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Отклонить
                </button>
              </div>

              {rejecting === article.id && (
                <div className="space-y-2 rounded-md border border-red-100 bg-red-50 p-3">
                  <label className="text-sm font-semibold text-neutral-800" htmlFor={`note-${article.id}`}>
                    Причина отклонения
                  </label>
                  <textarea
                    id={`note-${article.id}`}
                    rows={3}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={1000}
                    className="field resize-y bg-white"
                    placeholder="Объясните автору, что нужно исправить"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" className="btn-ghost text-xs" onClick={() => setRejecting(null)}>Отмена</button>
                    <button type="button" className="btn-danger text-xs" disabled={busyId === article.id || note.trim().length < 3} onClick={() => decide(article.id, 'rejected')}>
                      Подтвердить отклонение
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {preview && <ArticlePreviewModal article={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
