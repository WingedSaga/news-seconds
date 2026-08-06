import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Пока ничего нет', description, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center gap-2 border-y border-neutral-300 bg-white/60 px-6 py-14 text-center">
      <Icon className="h-7 w-7 text-neutral-300" aria-hidden="true" />
      <p className="font-serif text-lg font-bold text-ink">{title}</p>
      {description && <p className="max-w-md text-sm text-neutral-500">{description}</p>}
    </div>
  );
}
