import { useEffect, useState } from 'react';
import { Flag } from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import { formatRelativeDate } from '../../utils/format';

export default function AdminReports() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/reports')
      .then(({ data }) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

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
                <span className="text-neutral-500">от {report.reporter?.username || 'пользователя'} · {formatRelativeDate(report.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-neutral-700">{report.reason || 'Причина не указана'}</p>
              <p className="break-all text-xs text-neutral-400">ID объекта: {report.target_id}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
