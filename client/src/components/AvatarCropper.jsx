import { useEffect, useRef, useState } from 'react';
import { Check, X, ZoomIn } from 'lucide-react';

const VIEWPORT = 280; // сторона окна кадрирования на экране
const OUTPUT = 512; // сторона готового аватара в пикселях

// Кадрирование аватара: снимок двигают пальцем или мышью, масштаб — ползунком.
// Итог всегда квадратный, поэтому в круглой рамке нигде не будет пустот.
export default function AvatarCropper({ file, onCancel, onDone }) {
  const [src, setSrc] = useState('');
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);

    const img = new Image();
    img.onload = () => setImage(img);
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!image) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
        <p className="text-sm text-white">Открываем изображение...</p>
      </div>
    );
  }

  // Масштаб, при котором снимок целиком закрывает окно кадрирования.
  const base = VIEWPORT / Math.min(image.width, image.height);
  const scale = base * zoom;
  const shownW = image.width * scale;
  const shownH = image.height * scale;

  // Не даём утащить снимок так, чтобы в окне появился пустой угол.
  const clamp = (next) => {
    const maxX = Math.max(0, (shownW - VIEWPORT) / 2);
    const maxY = Math.max(0, (shownH - VIEWPORT) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  };

  const startDrag = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerX: event.clientX, pointerY: event.clientY, from: offset };
  };

  const onDrag = (event) => {
    const drag = dragRef.current;
    if (!drag) return;

    setOffset(
      clamp({
        x: drag.from.x + (event.clientX - drag.pointerX),
        y: drag.from.y + (event.clientY - drag.pointerY),
      })
    );
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const changeZoom = (value) => {
    setZoom(value);
    setOffset((prev) => clamp(prev));
  };

  const apply = () => {
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d');

    // Переводим положение на экране в координаты исходного файла.
    const sourceSide = VIEWPORT / scale;
    const sx = image.width / 2 - offset.x / scale - sourceSide / 2;
    const sy = image.height / 2 - offset.y / scale - sourceSide / 2;

    ctx.drawImage(image, sx, sy, sourceSide, sourceSide, 0, 0, OUTPUT, OUTPUT);
    canvas.toBlob((blob) => blob && onDone(blob), 'image/jpeg', 0.9);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Кадрирование аватара"
    >
      <div className="w-full max-w-sm space-y-4 rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-neutral-900">Выберите область</h2>
          <button type="button" onClick={onCancel} className="btn-ghost" aria-label="Отменить">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div
          className="relative mx-auto touch-none overflow-hidden rounded-full bg-neutral-100"
          style={{ width: VIEWPORT, height: VIEWPORT }}
          onPointerDown={startDrag}
          onPointerMove={onDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute left-1/2 top-1/2 max-w-none select-none"
            style={{
              width: shownW,
              height: shownH,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/70" />
        </div>

        <label className="flex items-center gap-3">
          <ZoomIn className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden="true" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => changeZoom(Number(event.target.value))}
            className="w-full accent-[#2E7D32]"
            aria-label="Масштаб"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Отмена
          </button>
          <button type="button" className="btn-primary" onClick={apply}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
