import { useEffect, useState } from 'react';
import { Check, Flag, X } from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { formatRelativeDate } from '../../utils/format';

export default function AdminReports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api.get('/admin/reports')
      .then(({ data }) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const setStatus = async (report, status) => {
    setBusyId(report.id);
    setError('');
    try {
      const { data } = await api.patch(`/admin/reports/${report.id}/status`, { status });
      setItems((previous) => previous.map((item) => (item.id === data.item.id ? data.item : item)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Жалобы</h1>
        <p className="text-sm text-neutral-500">Сигналы читателей о материалах и комментариях.</p>
      </div>
      <ErrorMessage message={error} />
      {!error && items.length === 0 ? (
        <EmptyState title="Жалоб пока нет" description="Когда читатель пожалуется на контент, запись появится здесь." icon={Flag} />
      ) : (
        <ul className="space-y-3">
          {items.map((report) => (
            <li key={report.id} className="card space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="pill">{report.target_type === 'article' ? 'Материал' : 'Комментарий'}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${report.status === 'new' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-600'}`}>
                  {report.status === 'new' ? 'Новая' : report.status === 'resolved' ? 'Решена' : 'Отклонена'}
                </span>
                <span className="text-neutral-500">от {report.reporter?.username || 'пользователя'} · {formatRelativeDate(report.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-neutral-700">{report.reason || 'Причина не указана'}</p>
              <p className="break-all text-xs text-neutral-400">ID объекта: {report.target_id}</p>
              {report.status === 'new' && (
                <div className="flex gap-2 border-t border-neutral-100 pt-3">
                  <button type="button" className="btn-primary text-xs" disabled={busyId === report.id} onClick={() => setStatus(report, 'resolved')}>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" /> Решить
                  </button>
                  <button type="button" className="btn-ghost text-xs" disabled={busyId === report.id} onClick={() => setStatus(report, 'dismissed')}>
                    <X className="h-3.5 w-3.5" aria-hidden="true" /> Отклонить
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
