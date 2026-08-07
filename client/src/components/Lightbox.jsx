import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// Просмотр изображения во весь экран. Открывается по клику на фото
// в материале; закрывается клавишей Esc, фоном или крестиком.
export default function Lightbox({ images, index, onClose }) {
  const [current, setCurrent] = useState(index);
  const many = images.length > 1;

  const show = useCallback(
    (next) => setCurrent((next + images.length) % images.length),
    [images.length]
  );

  useEffect(() => setCurrent(index), [index]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') show(current + 1);
      if (event.key === 'ArrowLeft') show(current - 1);
    };
    document.addEventListener('keydown', onKey);

    // Фон не должен прокручиваться, пока открыт просмотр.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [current, onClose, show]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр изображения"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute right-3 top-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {many && (
        <>
          <button
            type="button"
            aria-label="Предыдущее изображение"
            onClick={(event) => {
              event.stopPropagation();
              show(current - 1);
            }}
            className="absolute left-2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Следующее изображение"
            onClick={(event) => {
              event.stopPropagation();
              show(current + 1);
            }}
            className="absolute right-2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </>
      )}

      <img
        src={images[current]}
        alt={`Изображение ${current + 1} из ${images.length}`}
        className="max-h-[90vh] max-w-full object-contain"
        onClick={(event) => event.stopPropagation()}
      />

      {many && (
        <p className="absolute bottom-4 text-sm text-white/70">
          {current + 1} из {images.length}
        </p>
      )}
    </div>
  );
}
