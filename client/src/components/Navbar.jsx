import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  FilePlus2,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Newspaper,
  User,
  X,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import BrandMark from './BrandMark';

function todayLine() {
  return new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Шапка в одну строку: название издания слева, служебные ссылки справа.
// Разделов нет — сайт показывает единую ленту.
export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
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
        if (data.site_title) setTitle(data.site_title);
      })
      .catch(() => {
        // Название по умолчанию уже задано — без настроек шапка не пострадает.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-double border-ink bg-white">
      <div className="mx-auto max-w-7xl px-4">
        {/* Разрядка живёт на самих служебных надписях: на названии издания
            она бы перебила его собственную плотную посадку. */}
        <div className="flex items-center justify-between gap-4 py-3 text-[11px] uppercase text-neutral-500">
          <div className="flex min-w-0 items-center gap-3">
            {/* Название издания слева — оно же ссылка на главную. */}
            <Link
              to="/"
              className="flex shrink-0 items-center gap-2 text-brand transition-colors hover:text-brand-hover"
              aria-label="На главную"
              title="На главную"
            >
              <BrandMark className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
              <span className="text-lg font-extrabold tracking-tight sm:text-xl">{title}</span>
            </Link>

            <span className="hidden truncate tracking-widest lg:inline">{todayLine()}</span>
          </div>

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
              <>
                {/* Гостю тоже нужны разделы сайта, а не только кнопки входа. */}
                <Link to="/" className="flex items-center gap-2 py-3 text-sm font-semibold text-neutral-600">
                  <Newspaper className="h-4 w-4" aria-hidden="true" />
                  Лента
                </Link>
                <Link to="/support" className="flex items-center gap-2 py-3 text-sm font-semibold text-neutral-600">
                  <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                  Поддержка
                </Link>
                <div className="flex gap-2 py-3">
                  <Link to="/login" className="btn-outline flex-1">
                    Вход
                  </Link>
                  <Link to="/register" className="btn-primary flex-1">
                    Регистрация
                  </Link>
                </div>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
