import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import ErrorMessage from '../../components/ErrorMessage';
import Loader from '../../components/Loader';

const PLACEMENTS = [
  ['home_top', 'Главная: перед лентой'],
  ['home_after_lead', 'Главная: после главной новости'],
  ['home_bottom', 'Главная: внизу ленты'],
];
const emptyAd = () => ({ id: crypto.randomUUID(), placement: 'home_after_lead', title: '', text: '', url: '', image_url: '', enabled: true });

export default function AdminAds() {
  const [ads, setAds] = useState([]); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const load = async () => { setLoading(true); setError(''); try { const { data } = await api.get('/admin/settings'); setAds(Array.isArray(data.settings.ads) ? data.settings.ads : []); } catch (err) { setError(err.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const update = (index, key, value) => setAds((items) => items.map((ad, i) => i === index ? { ...ad, [key]: value } : ad));
  const save = async () => { setSaving(true); setError(''); try { const { data } = await api.patch('/admin/settings', { ads }); setAds(data.settings.ads || []); } catch (err) { setError(err.message); } finally { setSaving(false); } };
  if (loading) return <Loader label="Загружаем рекламу..." />;
  return <div className="max-w-3xl space-y-5"><div><h1 className="text-2xl font-extrabold text-neutral-900">Реклама</h1><p className="text-sm text-neutral-500">Подписчики эти блоки не видят. HTML и скрипты намеренно запрещены.</p></div><ErrorMessage message={error} onRetry={load} />{ads.map((ad, index) => <section className="card grid gap-3 p-5" key={ad.id || index}><div className="flex justify-between gap-3"><select className="field" value={ad.placement} onChange={(e) => update(index, 'placement', e.target.value)}>{PLACEMENTS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={Boolean(ad.enabled)} onChange={(e) => update(index, 'enabled', e.target.checked)} /> Включена</label></div><input className="field" maxLength="90" placeholder="Заголовок" value={ad.title} onChange={(e) => update(index, 'title', e.target.value)} /><textarea className="field min-h-20" maxLength="220" placeholder="Короткий текст" value={ad.text || ''} onChange={(e) => update(index, 'text', e.target.value)} /><input className="field" type="url" placeholder="Ссылка при нажатии: https://example.com" value={ad.url} onChange={(e) => update(index, 'url', e.target.value)} /><input className="field" type="url" placeholder="Фото (необязательно): https://example.com/banner.jpg" value={ad.image_url || ''} onChange={(e) => update(index, 'image_url', e.target.value)} /><button type="button" className="btn-outline w-fit text-red-600" onClick={() => setAds((items) => items.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" />Удалить</button></section>)}<div className="flex flex-wrap gap-2"><button type="button" className="btn-outline" disabled={ads.length >= 6} onClick={() => setAds((items) => [...items, emptyAd()])}><Plus className="h-4 w-4" />Добавить блок</button><button type="button" className="btn-primary" disabled={saving} onClick={save}><Save className="h-4 w-4" />{saving ? 'Сохраняем...' : 'Сохранить'}</button></div></div>;
}
