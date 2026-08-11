import { NavLink } from 'react-router-dom';
import { MonitorSmartphone } from 'lucide-react';
import {
  ClipboardList,
  FileStack,
  Flag,
  Home,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  ScrollText,
  SlidersHorizontal,
  Users,
} from 'lucide-react';

const LINKS = [
  { to: '/admin/logins', label: 'Входы', icon: MonitorSmartphone },
  { to: '/admin', label: 'Обзор', icon: LayoutDashboard, end: true },
  { to: '/admin/pending', label: 'Модерация', icon: ClipboardList },
  { to: '/admin/articles', label: 'Все статьи', icon: FileStack },
  { to: '/admin/comments', label: 'Комментарии', icon: MessageSquare },
  { to: '/admin/reports', label: 'Жалобы', icon: Flag },
  { to: '/admin/users', label: 'Пользователи', icon: Users },
  { to: '/admin/support', label: 'Поддержка', icon: LifeBuoy },
  { to: '/admin/logs', label: 'Журнал', icon: ScrollText },
  { to: '/admin/settings', label: 'Управление', icon: SlidersHorizontal },
];

export default function AdminSidebar() {
  return (
    // Без min-w-0 полоса разделов растягивала всю страницу шире экрана:
    // прокрутка оставалась у страницы, а не у самой полосы.
    <aside className="w-full min-w-0 shrink-0 bg-brand-dark text-white lg:min-h-[calc(100vh-4rem)] lg:w-60">
      <div className="px-4 py-4 lg:py-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-accent">Панель</p>
        <p className="text-lg font-extrabold">Администратор</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:overflow-visible lg:pb-6">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                isActive ? 'bg-brand text-white' : 'text-brand-accent hover:bg-brand/60 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </NavLink>
        ))}

        <NavLink
          to="/"
          className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold text-brand-accent transition-colors hover:bg-brand/60 hover:text-white lg:mt-4"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          На сайт
        </NavLink>
      </nav>
    </aside>
  );
}
