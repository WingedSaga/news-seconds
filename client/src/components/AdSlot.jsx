import { ExternalLink, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdSlot({ ads = [], placement }) {
  const { user } = useAuth();
  if (user?.subscription?.is_active) return null;
  const item = ads.find((ad) => ad?.enabled && ad.placement === placement && ad.title && ad.url);
  if (!item) return null;

  return (
    <aside className="rounded-2xl border border-brand/20 bg-brand-soft/60 p-5" aria-label="Реклама">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500">
        <Megaphone className="h-3.5 w-3.5" aria-hidden="true" /> Реклама
      </p>
      <a href={item.url} target="_blank" rel="noreferrer sponsored" className="group block">
        <h2 className="text-base font-extrabold text-neutral-900 group-hover:text-brand">{item.title}</h2>
        {item.text && <p className="mt-1 text-sm leading-6 text-neutral-600">{item.text}</p>}
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand">Подробнее <ExternalLink className="h-3.5 w-3.5" /></span>
      </a>
    </aside>
  );
}
