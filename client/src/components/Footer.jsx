import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import BrandMark from './BrandMark';
import { DONATION_URL } from '../constants';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-brand">
          <BrandMark className="h-6 w-6" />
          <span className="text-sm font-extrabold tracking-tight">НОВОСТИ СЕКУНДЫ</span>
        </div>

        <nav className="flex flex-wrap gap-4 text-sm text-neutral-500">
          <Link to="/" className="hover:text-brand">
            Лента
          </Link>
          <Link to="/submit" className="hover:text-brand">
            Предложить новость
          </Link>
          <Link to="/support" className="hover:text-brand">
            Поддержка
          </Link>
          {/* Внешняя ссылка: открываем в новой вкладке, чтобы не уводить
              читателя с сайта. */}
          <a
            href={DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-brand hover:text-brand-hover"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
            Поддержать
          </a>
        </nav>

        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()} НОВОСТИ СЕКУНДЫ. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
