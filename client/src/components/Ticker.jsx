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
    <div className="border-b border-brand-dark bg-brand text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4">
        <span className="flex shrink-0 items-center gap-2 py-2 text-xs font-bold uppercase tracking-wide">
          <Radio className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Срочно</span>
        </span>

        <div className="relative flex-1 overflow-hidden py-2">
          <div className="ticker-track flex w-max animate-ticker items-center gap-8 whitespace-nowrap">
            {loop.map((item, index) => (
              <Link
                key={`${item.id}-${index}`}
                to={`/article/${item.id}`}
                className="text-sm text-white/90 hover:text-white hover:underline"
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
