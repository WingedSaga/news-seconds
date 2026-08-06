import { Link } from 'react-router-dom';
import { Newspaper } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-brand">
          <Newspaper className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-extrabold tracking-tight">НОВОСТИ СЕКУНДЫ</span>
        </div>

        <nav className="flex flex-wrap gap-4 text-sm text-neutral-500">
          <Link to="/" className="hover:text-brand">
            Новости
          </Link>
          <Link to="/jokes" className="hover:text-brand">
            Анекдоты
          </Link>
          <Link to="/weather" className="hover:text-brand">
            Погода
          </Link>
          <Link to="/submit" className="hover:text-brand">
            Предложить новость
          </Link>
          <Link to="/support" className="hover:text-brand">
            Поддержка
          </Link>
        </nav>

        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()} НОВОСТИ СЕКУНДЫ. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
