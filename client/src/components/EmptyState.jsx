import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Пока ничего нет', description, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
      <Icon className="h-8 w-8 text-brand-accent" aria-hidden="true" />
      <p className="text-base font-semibold text-neutral-700">{title}</p>
      {description && <p className="max-w-md text-sm text-neutral-500">{description}</p>}
    </div>
  );
}
