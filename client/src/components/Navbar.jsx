import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, FilePlus2, LayoutDashboard, LifeBuoy, LogOut, Menu, User, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

function todayLine() {
  return new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Шапка: дата слева, название по центру, служебные ссылки справа.
// Разделов нет — сайт показывает единую ленту.
export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tagline, setTagline] = useState('');
  const [title, setTitle] = useState('НОВОСТИ СЕКУНДЫ');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/settings')
      .then(({ data }) => {
        if (cancelled) return;
        setTagline(data.site_tagline || '');
        if (data.site_title) setTitle(data.site_title);
      })
      .catch(() => {
        // Подзаголовок необязателен: без него шапка просто чуть короче.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Название набирается в две строки: первое слово крупно, остальное — разрядкой.
  const [titleTop, ...titleRest] = title.trim().split(/\s+/);
  const titleBottom = titleRest.join(' ');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b-[3px] border-double border-ink bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between gap-4 border-b border-neutral-200 py-2 text-[11px] uppercase tracking-widest text-neutral-500">
          <span className="hidden sm:inline">{todayLine()}</span>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/bookmarks" className="btn-ghost hidden sm:inline-flex" title="Закладки">
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/profile"
                  className="hidden items-center gap-2 rounded px-2 py-1 hover:bg-neutral-100 sm:flex"
                  title="Профиль"
                >
                  <Avatar user={user} size="sm" />
                  <span className="max-w-[120px] truncate normal-case tracking-normal">
                    {user.username}
                  </span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="btn-ghost hidden sm:inline-flex" title="Админ-панель">
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
                <button type="button" onClick={handleLogout} className="btn-ghost hidden sm:inline-flex" title="Выйти">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-outline hidden py-1 sm:inline-flex">
                  Вход
                </Link>
                <Link to="/register" className="btn-primary hidden py-1 sm:inline-flex">
                  Регистрация
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="btn-ghost sm:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="py-4 text-center sm:py-6">
          <Link to="/" className="inline-block">
            <h1 className="font-serif text-3xl font-black uppercase leading-none tracking-[0.08em] text-ink sm:text-5xl">
              {titleTop}
            </h1>
            {titleBottom && (
              <span className="mt-1 block font-serif text-base uppercase tracking-[0.35em] text-brand sm:text-xl">
                {titleBottom}
              </span>
            )}
          </Link>

          {tagline && (
            <p className="mt-2 font-serif text-xs italic text-neutral-500 sm:text-sm">{tagline}</p>
          )}
        </div>

      </div>

      {menuOpen && (
        <nav className="animate-fade-in border-t border-neutral-200 bg-white sm:hidden" aria-label="Меню">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {isAuthenticated ? (
              <>
                <Link to="/submit" className="flex items-center gap-2 py-3 text-sm font-semibold text-neutral-600">
                  <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                  Предложить новость
                </Link>
                <Link to="/profile" className="flex items-center gap-2 py-3 text-sm font-semibold text-neutral-600">
                  <User className="h-4 w-4" aria-hidden="true" />
                  Профиль
                </Link>
                <Link to="/my-articles" className="flex items-center gap-2 py-3 text-sm font-semibold text-neutral-600">
                  <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                  Мои новости
                </Link>
                <Link to="/bookmarks" className="flex items-center gap-2 py-3 text-sm font-semibold text-neutral-600">
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                  Закладки
                </Link>
                <Link to="/support" className="flex items-center gap-2 py-3 text-sm font-semibold text-neutral-600">
                  <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                  Поддержка
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-2 py-3 text-sm font-semibold text-neutral-600">
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    Админ-панель
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-3 text-left text-sm font-semibold text-red-600"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Выйти
                </button>
              </>
            ) : (
              <div className="flex gap-2 py-3">
                <Link to="/login" className="btn-outline flex-1">
                  Вход
                </Link>
                <Link to="/register" className="btn-primary flex-1">
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
