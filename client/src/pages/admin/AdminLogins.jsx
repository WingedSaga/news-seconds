import { useCallback, useEffect, useState } from 'react';
import { MonitorSmartphone } from 'lucide-react';
import api from '../../api/axios';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import SetupNotice from '../../components/SetupNotice';
import { formatDateTime, formatRelativeDate } from '../../utils/format';

export default function AdminLogins() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(() => {
    setLoading(true); setError('');
    return api.get('/admin/login-activity').then(({ data }) => {
      setItems(data.items || []); setNotice(data.notice || '');
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-extrabold text-neutral-900">Входы</h1><p className="text-sm text-neutral-500">Последние 300 успешных входов: устройство, браузер, IP и время.</p></div>
    <SetupNotice message={notice} /><ErrorMessage message={error} onRetry={load} />
    {loading ? <Loader /> : items.length === 0 ? (!error && <EmptyState title="Входов пока нет" description="Новые успешные входы появятся здесь автоматически." icon={MonitorSmartphone} />) : <div className="card overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500"><tr><th className="px-4 py-3">Когда</th><th className="px-4 py-3">Пользователь</th><th className="px-4 py-3">Устройство</th><th className="px-4 py-3">IP</th></tr></thead><tbody className="divide-y divide-neutral-100">{items.map((entry) => <tr key={entry.id} className="hover:bg-neutral-50"><td className="whitespace-nowrap px-4 py-3 text-neutral-500" title={formatDateTime(entry.created_at)}>{formatRelativeDate(entry.created_at)}</td><td className="px-4 py-3"><p className="font-semibold text-neutral-800">{entry.user?.username || 'Удалённый пользователь'}</p><p className="text-xs text-neutral-500">{entry.user?.email || '—'}</p></td><td className="px-4 py-3 text-neutral-700" title={entry.user_agent || ''}>{entry.device_label || 'Неизвестно'}</td><td className="px-4 py-3 font-mono text-xs text-neutral-700">{entry.ip_address || '—'}</td></tr>)}</tbody></table></div>}
  </div>;
}
