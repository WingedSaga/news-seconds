import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Eye, Pencil, Save, Trash2, X } from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import SearchBar from '../../components/SearchBar';
import { CATEGORY_LABELS, STATUS_CLASSES, STATUS_LABELS, formatRelativeDate } from '../../utils/format';

const STATUS_FILTERS = [
  { value: '', label: 'Все' },
  { value: 'pending', label: 'На модерации' },
  { value: 'approved', label: 'Одобренные' },
  { value: 'rejected', label: 'Отклонённые' },
];

export default function AdminArticles() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [selected, setSelected] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .get('/admin/articles', {
        params: { ...(status ? { status } : {}), ...(debouncedSearch ? { search: debouncedSearch } : {}) },
      })
      .then(({ data }) => {
        if (cancelled) return;
        setItems(data.items);
        // Выбор относится к прежней выборке, после перезагрузки он неверен.
        setSelected([]);
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
  }, [status, debouncedSearch, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const toggleOne = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.length === items.length ? [] : items.map((item) => item.id)));
  };

  const runBulk = async (action) => {
    const labels = { approve: 'одобрить', reject: 'отклонить', delete: 'удалить' };
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Выбрано материалов: ${selected.length}. Действительно ${labels[action]}?`)) {
      return;
    }

    setBulkBusy(true);
    setError('');
    try {
      await api.post('/admin/articles/bulk', { ids: selected, action });
      setSelected([]);
      reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const startEdit = (article) => {
    setEditing({
      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      status: article.status,
    });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setError('');

    if (editing.title.trim().length < 5) {
      setError('Заголовок должен быть не короче 5 символов');
      return;
    }
    if (editing.content.trim().length < 20) {
      setError('Текст должен быть не короче 20 символов');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put(`/admin/articles/${editing.id}`, {
        title: editing.title.trim(),
        content: editing.content.trim(),
        category: editing.category,
        status: editing.status,
      });
      setItems((prev) => prev.map((article) => (article.id === data.item.id ? data.item : article)));
      setEditing(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (article) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Удалить статью «${article.title}»? Действие необратимо.`)) return;

    setError('');
    try {
      await api.delete(`/admin/articles/${article.id}`);
      setItems((prev) => prev.filter((item) => item.id !== article.id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Все статьи</h1>
        <p className="text-sm text-neutral-500">Редактирование и удаление материалов.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:max-w-sm sm:flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Поиск по заголовку..." />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                status === filter.value
                  ? 'bg-brand text-white'
                  : 'border border-neutral-200 bg-white text-neutral-600 hover:border-brand hover:text-brand'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-brand-accent bg-brand-accent/20 p-3">
          <span className="mr-auto text-sm font-semibold text-brand-dark">
            Выбрано: {selected.length}
          </span>
          <button type="button" className="btn-primary" disabled={bulkBusy} onClick={() => runBulk('approve')}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Одобрить
          </button>
          <button type="button" className="btn-outline" disabled={bulkBusy} onClick={() => runBulk('reject')}>
            <X className="h-4 w-4" aria-hidden="true" />
            Отклонить
          </button>
          <button type="button" className="btn-danger" disabled={bulkBusy} onClick={() => runBulk('delete')}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Удалить
          </button>
        </div>
      )}

      <ErrorMessage message={error} onRetry={reload} />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        !error && <EmptyState title="Статей не найдено" description="Измените фильтр или поисковый запрос." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Выбрать все"
                    className="h-4 w-4 accent-[#2E7D32]"
                    checked={items.length > 0 && selected.length === items.length}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3">Заголовок</th>
                <th className="px-4 py-3">Категория</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">Просмотры</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((article) => (
                <tr key={article.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`Выбрать «${article.title}»`}
                      className="h-4 w-4 accent-[#2E7D32]"
                      checked={selected.includes(article.id)}
                      onChange={() => toggleOne(article.id)}
                    />
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-3 font-semibold text-neutral-800">
                    {article.title}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{CATEGORY_LABELS[article.category]}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLASSES[article.status]}`}>
                      {STATUS_LABELS[article.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{article.views}</td>
                  <td className="px-4 py-3 text-neutral-500">{formatRelativeDate(article.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        to={`/article/${article.id}`}
                        className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-brand"
                        aria-label="Открыть статью"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => startEdit(article)}
                        className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-brand"
                        aria-label="Редактировать"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(article)}
                        className="rounded p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Удалить"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Редактирование статьи"
          onClick={() => setEditing(null)}
        >
          <form
            onSubmit={saveEdit}
            className="my-8 w-full max-w-2xl space-y-4 rounded-lg bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-neutral-900">Редактирование статьи</h2>
              <button type="button" onClick={() => setEditing(null)} className="btn-ghost" aria-label="Закрыть">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-title" className="text-sm font-semibold text-neutral-700">
                Заголовок
              </label>
              <input
                id="edit-title"
                className="field"
                value={editing.title}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="edit-category" className="text-sm font-semibold text-neutral-700">
                  Категория
                </label>
                <select
                  id="edit-category"
                  className="field"
                  value={editing.category}
                  onChange={(event) => setEditing({ ...editing, category: event.target.value })}
                >
                  <option value="news">Новости</option>
                  <option value="joke">Анекдоты</option>
                  <option value="weather">Погода</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="edit-status" className="text-sm font-semibold text-neutral-700">
                  Статус
                </label>
                <select
                  id="edit-status"
                  className="field"
                  value={editing.status}
                  onChange={(event) => setEditing({ ...editing, status: event.target.value })}
                >
                  <option value="pending">На модерации</option>
                  <option value="approved">Одобрено</option>
                  <option value="rejected">Отклонено</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="edit-content" className="text-sm font-semibold text-neutral-700">
                Текст
              </label>
              <textarea
                id="edit-content"
                rows={10}
                className="field resize-y"
                value={editing.content}
                onChange={(event) => setEditing({ ...editing, content: event.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>
                Отмена
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
