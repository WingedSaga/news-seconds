import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Eye, FileStack, MessageSquare, Users } from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';

const CARDS = [
  { key: 'totalUsers', label: 'Пользователей', icon: Users, to: '/admin/users' },
  { key: 'pendingArticles', label: 'На модерации', icon: ClipboardList, to: '/admin/pending' },
  { key: 'totalArticles', label: 'Всего статей', icon: FileStack, to: '/admin/articles' },
  { key: 'totalViews', label: 'Просмотров', icon: Eye },
  { key: 'totalComments', label: 'Комментариев', icon: MessageSquare },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api
      .get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Обзор</h1>
        <p className="text-sm text-neutral-500">Ключевые показатели издания.</p>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      {loading ? (
        <Loader />
      ) : stats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CARDS.map(({ key, label, icon: Icon, to }) => {
            const content = (
              <div className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
                <span className="rounded-md bg-brand-accent p-3 text-brand-dark">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-2xl font-extrabold text-neutral-900">{stats[key] ?? 0}</p>
                  <p className="text-sm text-neutral-500">{label}</p>
                </div>
              </div>
            );

            return to ? (
              <Link key={key} to={to} className="block">
                {content}
              </Link>
            ) : (
              <div key={key}>{content}</div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
