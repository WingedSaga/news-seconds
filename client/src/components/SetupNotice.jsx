import { Database } from 'lucide-react';

// Раздел, для которого не выполнена миграция: объясняем, что сделать,
// вместо безликой ошибки сервера.
export default function SetupNotice({ message }) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <Database className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
