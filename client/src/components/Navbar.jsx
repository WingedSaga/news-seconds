import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  FilePlus2,
  LayoutDashboard,
  LifeBuoy,
  Heart,
  LogOut,
  Menu,
  Moon,
  MessageCircle,
  Newspaper,
  Sun,
  User,
  X,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import BrandMark from './BrandMark';
import { DONATION_URL } from '../constants';
import { readStorage, writeStorage } from '../utils/storage';

// Шапка в одну строку: название издания слева, служебные ссылки справа.
// Разделов нет — сайт показывает единую ленту.
export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [title, setTitle] = useState('НОВОСТИ СЕКУНДЫ');
  const [theme, setTheme] = useState(() => {
    const saved = readStorage('ns_theme');
    return saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStorage('ns_theme', theme);
  }, [theme]);

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
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 shadow-[0_2px_12px_rgba(16,24,40,0.05)] backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        {/* Разрядка живёт на самих служебных надписях: на названии издания
            она бы перебила его собственную плотную посадку. */}
        <div className="flex items-center justify-between gap-2 py-2.5 text-[11px] uppercase text-neutral-500 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {/* Название издания слева — оно же ссылка на главную. */}
            <Link
              to="/"
              className="flex shrink-0 items-center gap-2 text-brand transition-colors hover:text-brand-hover"
              aria-label="На главную"
              title="На главную"
            >
              <BrandMark className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
              <span className="truncate text-base font-extrabold tracking-tight sm:text-lg">{title}</span>
            </Link>

          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <a
              href="https://wingedsaga.github.io/Messages-seconds/"
              className="btn-ghost hidden gap-0 px-2.5 py-1.5 text-brand md:inline-flex"
              title="Сообщения секунды"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Сообщения
            </a>
            <button
              type="button"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              className="hidden"
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </button>
            {/* Главное действие сайта: лента живёт присланными новостями,
                поэтому это единственная заливная кнопка в шапке. Гостя
                ProtectedRoute отправит на вход. */}
            <Link
              to="/submit"
              className="btn-primary hidden py-1.5 shadow-brand/25 md:inline-flex"
              title="Предложить новость"
            >
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              Предложить новость
            </Link>

            {/* На узком экране места на подпись нет, остаётся сам знак. */}
            <Link
              to="/submit"
              className="btn-primary px-2.5 py-1.5 md:hidden"
              aria-label="Предложить новость"
              title="Предложить новость"
            >
              <FilePlus2 className="h-5 w-5" aria-hidden="true" />
            </Link>

            {/* Пожертвование — внешняя ссылка, поэтому обычный <a>. */}
            <a
              href={DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden"
              title="Поддержать издание"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              Поддержать
            </a>

            {isAuthenticated ? (
              <>
                <Link to="/bookmarks" className="hidden" title="Закладки">
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/profile"
                  className="hidden"
                  title="Профиль"
                >
                  <Avatar user={user} size="sm" />
                  <span className="max-w-[120px] truncate normal-case tracking-normal">
                    {user.username}
                  </span>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="hidden" title="Админ-панель">
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
                <button type="button" onClick={handleLogout} className="hidden" title="Выйти">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                {/* Вход и регистрация ушли на второй план: две заливные
                    кнопки рядом спорят, и главная перестаёт читаться. */}
                <Link to="/login" className="hidden">
                  Вход
                </Link>
                <Link to="/register" className="hidden">
                  Регистрация
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="btn-ghost px-2.5"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

      </div>

      {menuOpen && (
        <nav className="animate-fade-in border-t border-neutral-200 bg-white sm:absolute sm:right-4 sm:top-full sm:w-80 sm:rounded-b-xl sm:border sm:border-t-0 sm:shadow-lg" aria-label="Меню">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {isAuthenticated ? (
              <>
                <Link to="/submit" className="btn-primary my-2 w-full">
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
                <a href="https://wingedsaga.github.io/Messages-seconds/" className="flex items-center gap-2 py-3 text-sm font-semibold text-brand">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Сообщения
                </a>
                <a
                  href={DONATION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-3 text-sm font-semibold text-brand"
                >
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  Поддержать
                </a>
                <button
                  type="button"
                  onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                  className="flex items-center gap-2 py-3 text-left text-sm font-semibold text-neutral-600"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
                  {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
                </button>
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
                <Link to="/submit" className="btn-primary my-2 w-full">
                  <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                  Предложить новость
                </Link>
                <Link to="/" className="flex items-center gap-2 py-3 text-sm font-semibold text-neutral-600">
                  <Newspaper className="h-4 w-4" aria-hidden="true" />
                  Лента
                </Link>
                <Link to="/support" className="flex items-center gap-2 py-3 text-sm font-semibold text-neutral-600">
                  <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                  Поддержка
                </Link>
                <a href="https://wingedsaga.github.io/Messages-seconds/" className="flex items-center gap-2 py-3 text-sm font-semibold text-brand">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Сообщения
                </a>
                <a
                  href={DONATION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-3 text-sm font-semibold text-brand"
                >
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  Поддержать
                </a>
                <button
                  type="button"
                  onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                  className="flex items-center gap-2 py-3 text-left text-sm font-semibold text-neutral-600"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
                  {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
                </button>
                <div className="flex gap-2 py-3">
                  <Link to="/login" className="btn-ghost flex-1 border border-neutral-300">
                    Вход
                  </Link>
                  <Link to="/register" className="btn-outline flex-1">
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
