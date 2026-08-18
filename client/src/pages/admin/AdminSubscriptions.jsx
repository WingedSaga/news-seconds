import { useEffect, useState } from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import ErrorMessage from '../../components/ErrorMessage';
import Loader from '../../components/Loader';

export default function AdminSubscriptions() {
  const [enabled, setEnabled] = useState(true); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const { data } = await api.get('/admin/settings'); setEnabled(data.settings.subscription_features_enabled !== false); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const toggle = async (value) => { const old = enabled; setEnabled(value); setSaving(true); setError(''); try { await api.patch('/admin/settings', { subscription_features_enabled: value }); } catch (err) { setEnabled(old); setError(err.message); } finally { setSaving(false); } };
  if (loading) return <Loader label="Загружаем подписки..." />;
  return <div className="max-w-2xl space-y-6"><div><h1 className="text-2xl font-extrabold text-neutral-900">Подписки</h1><p className="text-sm text-neutral-500">Управление преимуществами и ручной выдачей доступа.</p></div><ErrorMessage message={error} onRetry={load} /><section className="card space-y-4 p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 font-bold text-neutral-900"><ShieldCheck className="h-5 w-5 text-brand" />Преимущества подписки</h2><p className="mt-1 text-sm text-neutral-500">Значок, отсутствие рекламы и повышенные лимиты. Платёжные записи и ручные выдачи не удаляются.</p></div><button type="button" role="switch" aria-checked={enabled} disabled={saving} onClick={() => toggle(!enabled)} className={`relative h-7 w-12 rounded-full transition-colors ${enabled ? 'bg-brand' : 'bg-neutral-300'} disabled:opacity-50`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} /></button></div><p className={`rounded-lg px-3 py-2 text-sm font-semibold ${enabled ? 'bg-brand-soft text-brand-dark' : 'bg-amber-50 text-amber-800'}`}>{enabled ? 'Преимущества включены.' : 'Аварийный режим: преимущества временно отключены для всех.'}</p></section><section className="card flex items-center justify-between gap-4 p-5"><div><h2 className="font-bold text-neutral-900">Выдать вручную</h2><p className="mt-1 text-sm text-neutral-500">Выдача и отзыв подписок для отдельных пользователей.</p></div><Link className="btn-primary" to="/admin/users"><Users className="h-4 w-4" />Пользователи</Link></section></div>;
}
