import { Loader2 } from 'lucide-react';

export default function Loader({ label = 'Загрузка...', className = '' }) {
  return (
    <div className={`flex items-center justify-center gap-2 py-10 text-neutral-500 ${className}`}>
      <Loader2 className="h-5 w-5 animate-spin text-brand" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
