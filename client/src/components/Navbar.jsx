import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const NAV_LINKS = [
  { to: '/', label: 'Новости', end: true },
  { to: '/jokes', label: 'Анекдоты' },
  { to: '/weather', label: 'Погода' },
];

function navLinkClass({ isActive }) {
  return [
    'relative py-2 text-sm font-semibold transition-colors',
    isActive ? 'text-brand' : 'text-neutral-600 hover:text-brand',
    isActive
      ? 'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand after:content-[""]'
      : '',
  ].join(' ');
}

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Закрываем мобильное меню при переходе на другую страницу.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 text-brand">
          <Newspaper className="h-7 w-7" aria-hidden="true" />
          <span className="text-base font-extrabold leading-tight tracking-tight sm:text-lg">
            НОВОСТИ
            <span className="block text-[10px] font-bold tracking-[0.25em] text-neutral-500 sm:text-xs">
              СЕКУНДЫ
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Основная навигация">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated && (
            <NavLink to="/submit" className={navLinkClass}>
              Предложить новость
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClass}>
              Админ-панель
            </NavLink>
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <Link to="/bookmarks" className="btn-ghost" title="Закладки">
                <Bookmark className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/my-articles" className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-neutral-100">
                <Avatar user={user} size="md" />
                <span className="max-w-[120px] truncate text-sm font-semibold text-neutral-700">
                  {user.username}
                </span>
              </Link>
              <button type="button" onClick={handleLogout} className="btn-ghost" title="Выйти">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline">
                Вход
              </Link>
              <Link to="/register" className="btn-primary">
                Регистрация
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="btn-ghost md:hidden"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <div className="animate-fade-in border-t border-neutral-200 bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-2" aria-label="Мобильная навигация">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `border-l-2 py-3 pl-3 text-sm font-semibold ${
                    isActive ? 'border-brand text-brand' : 'border-transparent text-neutral-600'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {isAuthenticated ? (
              <>
                <Link to="/submit" className="flex items-center gap-2 py-3 pl-3 text-sm font-semibold text-neutral-600">
                  <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                  Предложить новость
                </Link>
                <Link to="/my-articles" className="flex items-center gap-2 py-3 pl-3 text-sm font-semibold text-neutral-600">
                  <User className="h-4 w-4" aria-hidden="true" />
                  Мои новости
                </Link>
                <Link to="/bookmarks" className="flex items-center gap-2 py-3 pl-3 text-sm font-semibold text-neutral-600">
                  <Bookmark className="h-4 w-4" aria-hidden="true" />
                  Закладки
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-2 py-3 pl-3 text-sm font-semibold text-neutral-600">
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    Админ-панель
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-3 pl-3 text-left text-sm font-semibold text-red-600"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Выйти
                </button>
              </>
            ) : (
              <div className="flex gap-2 py-3 pl-3">
                <Link to="/login" className="btn-outline flex-1">
                  Вход
                </Link>
                <Link to="/register" className="btn-primary flex-1">
                  Регистрация
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
