import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  // Показываем не более пяти номеров вокруг текущей страницы.
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages = [];
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Постраничная навигация">
      <button
        type="button"
        className="btn-ghost"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Предыдущая страница"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      {pages.map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onChange(number)}
          aria-current={number === page ? 'page' : undefined}
          className={`h-9 w-9 rounded-md text-sm font-semibold transition-colors ${
            number === page
              ? 'bg-brand text-white'
              : 'border border-neutral-200 bg-white text-neutral-600 hover:border-brand hover:text-brand'
          }`}
        >
          {number}
        </button>
      ))}

      <button
        type="button"
        className="btn-ghost"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Следующая страница"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
