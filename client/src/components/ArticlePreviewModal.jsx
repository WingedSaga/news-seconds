import { useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import { CATEGORY_LABELS, formatDateTime } from '../utils/format';

// Модальное окно предпросмотра статьи для модерации.
export default function ArticlePreviewModal({ article, onClose }) {
  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!article) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Предпросмотр статьи"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-lg bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">Предпросмотр</h2>
          <button type="button" onClick={onClose} className="btn-ghost" aria-label="Закрыть">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {article.image_url && (
          <img src={article.image_url} alt={article.title} className="h-56 w-full object-cover" />
        )}

        <div className="space-y-4 p-5">
          <span className="pill">{CATEGORY_LABELS[article.category] || article.category}</span>
          <h3 className="text-2xl font-extrabold text-neutral-900">{article.title}</h3>

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500">
            <span>Автор: {article.author?.username || 'Аноним'}</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDateTime(article.created_at)}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
            {article.content}
          </div>
        </div>
      </div>
    </div>
  );
}
