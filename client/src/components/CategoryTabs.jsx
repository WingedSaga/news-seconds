import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Новости', end: true },
  { to: '/jokes', label: 'Анекдоты' },
  { to: '/weather', label: 'Погода' },
];

export default function CategoryTabs() {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-neutral-200" role="tablist">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors ${
              isActive
                ? 'text-brand after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand after:content-[""]'
                : 'text-neutral-500 hover:text-brand'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
