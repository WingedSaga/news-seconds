import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  ClipboardList,
  Eye,
  LifeBuoy,
  FileStack,
  MessageSquare,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import { BarList, StatTile, TimelineChart } from '../../components/admin/Charts';
import { CATEGORY_LABELS, excerpt, formatRelativeDate } from '../../utils/format';

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

  if (loading) return <Loader label="Собираем статистику..." />;

  if (!stats) {
    return <ErrorMessage message={error} onRetry={load} />;
  }

  const categoryItems = Object.entries(stats.byCategory).map(([key, value]) => ({
    label: CATEGORY_LABELS[key] || key,
    value,
  }));

  const statusItems = [
    { label: 'Одобрено', value: stats.approvedArticles },
    { label: 'На модерации', value: stats.pendingArticles },
    { label: 'Отклонено', value: stats.rejectedArticles },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Обзор</h1>
        <p className="text-sm text-neutral-500">Состояние издания на текущий момент.</p>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Пользователей" value={stats.totalUsers} icon={Users} hint={`${stats.admins} с правами админа`} />
        <StatTile label="Новых за неделю" value={stats.newUsers} icon={UserPlus} />
        <StatTile
          label="На модерации"
          value={stats.pendingArticles}
          icon={ClipboardList}
          tone={stats.pendingArticles > 0 ? 'warning' : 'neutral'}
        />
        <StatTile label="Всего статей" value={stats.totalArticles} icon={FileStack} />
        <StatTile label="Просмотров" value={stats.totalViews} icon={Eye} />
        <StatTile label="Комментариев" value={stats.totalComments} icon={MessageSquare} />
        <StatTile label="Закладок" value={stats.totalBookmarks} icon={Bookmark} />
        <StatTile
          label="Открытых обращений"
          value={stats.openTickets === null ? '—' : stats.openTickets}
          hint={stats.openTickets === null ? 'Поддержка не настроена' : undefined}
          icon={LifeBuoy}
          tone={stats.openTickets > 0 ? 'warning' : 'neutral'}
        />
        <StatTile
          label="Заблокировано"
          value={stats.bannedUsers}
          icon={ShieldCheck}
          tone={stats.bannedUsers > 0 ? 'danger' : 'neutral'}
        />
      </div>

      <TimelineChart title="Публикации за две недели" points={stats.timeline} />

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="Материалы по разделам" items={categoryItems} />
        <BarList title="Материалы по статусам" items={statusItems} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-3 p-5">
          <h2 className="text-base font-bold text-neutral-900">Самые читаемые</h2>
          {stats.topArticles.length === 0 ? (
            <p className="text-sm text-neutral-500">Пока нет опубликованных материалов.</p>
          ) : (
            <ol className="space-y-2">
              {stats.topArticles.map((article, index) => (
                <li key={article.id} className="flex items-baseline gap-3 text-sm">
                  <span className="w-4 shrink-0 font-bold text-neutral-400">{index + 1}</span>
                  <Link to={`/article/${article.id}`} className="min-w-0 flex-1 truncate hover:text-brand">
                    {article.title}
                  </Link>
                  <span className="shrink-0 tabular-nums text-neutral-500">{article.views}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="card space-y-3 p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-neutral-900">Ждут проверки</h2>
            <Link to="/admin/pending" className="text-xs font-semibold text-brand hover:underline">
              Ко всей очереди
            </Link>
          </div>

          {stats.latestPending.length === 0 ? (
            <p className="text-sm text-neutral-500">Очередь модерации пуста.</p>
          ) : (
            <ul className="space-y-2">
              {stats.latestPending.map((article) => (
                <li key={article.id} className="text-sm">
                  <p className="truncate font-semibold text-neutral-800">{article.title}</p>
                  <p className="text-xs text-neutral-500">
                    {article.author?.username || 'Аноним'} · {formatRelativeDate(article.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card space-y-3 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-bold text-neutral-900">Последние комментарии</h2>
          <Link to="/admin/comments" className="text-xs font-semibold text-brand hover:underline">
            Все комментарии
          </Link>
        </div>

        {stats.latestComments.length === 0 ? (
          <p className="text-sm text-neutral-500">Комментариев пока нет.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {stats.latestComments.map((comment) => (
              <li key={comment.id} className="py-2 text-sm">
                <p className="text-neutral-700">{excerpt(comment.text, 120)}</p>
                <p className="text-xs text-neutral-500">
                  {comment.author?.username || 'Аноним'} · {formatRelativeDate(comment.created_at)}
                  {comment.article && (
                    <>
                      {' · '}
                      <Link to={`/article/${comment.article.id}`} className="hover:text-brand">
                        {excerpt(comment.article.title, 40)}
                      </Link>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
