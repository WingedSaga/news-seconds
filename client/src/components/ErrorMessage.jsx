import { AlertTriangle, RotateCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {message}
      </span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-outline shrink-0 self-start sm:self-auto">
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          Повторить
        </button>
      )}
    </div>
  );
}
