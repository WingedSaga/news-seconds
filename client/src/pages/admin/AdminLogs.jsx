import { useCallback, useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import SetupNotice from '../../components/SetupNotice';
import { formatDateTime, formatRelativeDate } from '../../utils/format';

const ACTION_LABELS = {
  'article.approved': 'Статья одобрена',
  'article.rejected': 'Статья отклонена',
  'article.pending': 'Статья возвращена на модерацию',
  'article.delete': 'Статья удалена',
  'article.bulk_approve': 'Массовое одобрение статей',
  'article.bulk_reject': 'Массовое отклонение статей',
  'article.bulk_delete': 'Массовое удаление статей',
  'comment.delete': 'Комментарий удалён',
  'user.role': 'Изменена роль пользователя',
  'user.ban': 'Пользователь заблокирован',
  'user.unban': 'Пользователь разблокирован',
  'user.promote': 'Назначен администратор',
  'user.delete': 'Пользователь удалён',
  'settings.update': 'Изменены настройки сайта',
  'export.users': 'Выгрузка пользователей',
  'export.articles': 'Выгрузка статей',
};

function describe(entry) {
  const details = entry.details || {};

  if (details.username) return details.username;
  if (details.title) return details.title;
  if (details.text) return `«${details.text}»`;
  if (details.count !== undefined) return `${details.count} шт.`;

  const keys = Object.keys(details);
  if (keys.length > 0) {
    return keys.map((key) => `${key}: ${String(details[key])}`).join(', ');
  }
  return '';
}

export default function AdminLogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api
      .get('/admin/logs')
      .then(({ data }) => {
        setItems(data.items);
        setNotice(data.notice || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Журнал действий</h1>
        <p className="text-sm text-neutral-500">
          Кто и что менял в панели. Последние 150 записей.
        </p>
      </div>

      <SetupNotice message={notice} />

      <ErrorMessage message={error} onRetry={load} />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        !error && (
          <EmptyState
            title="Записей пока нет"
            description="Здесь появятся действия администраторов: модерация, роли, настройки."
            icon={ScrollText}
          />
        )
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Когда</th>
                <th className="px-4 py-3">Кто</th>
                <th className="px-4 py-3">Действие</th>
                <th className="px-4 py-3">Объект</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {items.map((entry) => (
                <tr key={entry.id} className="hover:bg-neutral-50">
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-500" title={formatDateTime(entry.created_at)}>
                    {formatRelativeDate(entry.created_at)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-800">{entry.actor_name}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {ACTION_LABELS[entry.action] || entry.action}
                  </td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-neutral-500">
                    {describe(entry)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
