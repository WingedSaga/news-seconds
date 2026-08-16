import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import BrandMark from './BrandMark';
import Calculator from './Calculator';
import { DONATION_URL } from '../constants';

export default function Footer() {
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <footer className="mt-14 border-t border-neutral-200 bg-white/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-9 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-brand">
          <BrandMark className="h-6 w-6" />
          <span className="whitespace-nowrap text-sm font-extrabold tracking-tight">НОВОСТИ СЕКУНДЫ</span>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-500">
          <Link to="/" className="hover:text-brand">
            Лента
          </Link>
          <Link to="/submit" className="hover:text-brand">
            Предложить новость
          </Link>
          <Link to="/support" className="hover:text-brand">
            Поддержка
          </Link>
          <a href="https://wingedsaga.github.io/Messages-seconds/" className="inline-flex items-center gap-1.5 font-semibold text-brand hover:text-brand-hover">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Сообщения
          </a>
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

        <p className="flex items-center gap-1 text-xs text-neutral-400">
          © {new Date().getFullYear()} НОВОСТИ СЕКУНДЫ. Все права защищены.
          {/* Тайный знак: почти сливается с фоном, проявляется при наведении. */}
          <button
            type="button"
            onClick={() => setCalcOpen(true)}
            aria-label="?"
            title="?"
            className="ml-0.5 rounded px-1 font-bold text-neutral-200 transition-colors hover:text-brand"
          >
            ?
          </button>
        </p>
      </div>

      {calcOpen && <Calculator onClose={() => setCalcOpen(false)} />}
    </footer>
  );
}
