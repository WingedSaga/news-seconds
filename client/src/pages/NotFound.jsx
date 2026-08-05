import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <SearchX className="h-12 w-12 text-brand-accent" aria-hidden="true" />
      <h1 className="text-3xl font-extrabold text-neutral-900">Страница не найдена</h1>
      <p className="max-w-md text-sm text-neutral-500">
        Возможно, материал удалён или адрес указан неверно.
      </p>
      <Link to="/" className="btn-primary">
        <Home className="h-4 w-4" aria-hidden="true" />
        На главную
      </Link>
    </div>
  );
}
