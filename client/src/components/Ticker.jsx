import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radio } from 'lucide-react';
import api from '../api/axios';

// Бегущая строка со свежими заголовками. Список дублируется,
// чтобы прокрутка на -50% выглядела бесшовной.
export default function Ticker() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/articles/ticker')
      .then(({ data }) => {
        if (!cancelled) setItems(data.items || []);
      })
      .catch(() => {
        // Молча скрываем строку: она не критична для страницы.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) return null;

  const loop = [...items, ...items];

  return (
    <div className="border-b border-brand/15 bg-brand-soft/60 text-brand-dark">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4">
        <span className="flex shrink-0 items-center gap-2 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
          <Radio className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Срочно</span>
        </span>

        <div className="relative flex-1 overflow-hidden py-1.5">
          <div className="ticker-track flex w-max animate-ticker items-center gap-8 whitespace-nowrap">
            {loop.map((item, index) => (
              <Link
                key={`${item.id}-${index}`}
                to={`/article/${item.id}`}
                className="font-serif text-sm text-brand-dark/85 transition-colors hover:text-brand hover:underline"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
