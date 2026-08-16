import { Link } from 'react-router-dom';
import { Clock, Eye, Images, Music, Play, Video } from 'lucide-react';
import Avatar from './Avatar';
import { CATEGORY_LABELS, excerpt, formatRelativeDate } from '../utils/format';

// Метки вложений поверх снимка: сколько кадров и есть ли запись.
function Badges({ imageCount, mediaType }) {
  if (imageCount < 2 && !mediaType) return null;

  return (
    <div className="flex items-center gap-2">
      {imageCount > 1 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <Images className="h-3 w-3" aria-hidden="true" />
          {imageCount}
        </span>
      )}
      {mediaType && (
        <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {mediaType === 'video' ? (
            <Video className="h-3 w-3" aria-hidden="true" />
          ) : (
            <Music className="h-3 w-3" aria-hidden="true" />
          )}
          {mediaType === 'video' ? 'Видео' : 'Аудио'}
        </span>
      )}
    </div>
  );
}

function Meta({ article, compact = false }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-neutral-500 ${
        compact ? 'text-xs' : 'text-[13px]'
      }`}
    >
      <span className="flex items-center gap-2">
        <Avatar user={article.author} size="sm" />
        <span className="font-medium text-neutral-700">{article.author?.username || 'Аноним'}</span>
      </span>
      <span className="text-neutral-300" aria-hidden="true">
        ·
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {formatRelativeDate(article.created_at)}
      </span>
      <span className="text-neutral-300" aria-hidden="true">
        ·
      </span>
      <span className="flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        {article.views ?? 0}
      </span>
    </div>
  );
}

// Материал без картинки, но с вложением, тоже должен что-то показывать:
// пустой прямоугольник в ленте читается как поломка.
function hasCover(article) {
  return Boolean(article.image_urls?.[0] || article.image_url || article.media_url);
}

// Снимок с предсказуемой пропорцией: без неё высокие и широкие кадры
// обрезаются по-разному и ряд карточек теряет ровную линию.
function Cover({ article, ratio, rounded }) {
  const imageCount = article.image_urls?.length || (article.image_url ? 1 : 0);
  const cover = article.image_urls?.[0] || article.image_url;
  const isVideo = !cover && article.media_url && article.media_type === 'video';
  const isAudio = !cover && article.media_url && article.media_type !== 'video';

  if (!cover && !isVideo && !isAudio) return null;

  return (
    <div className={`relative overflow-hidden bg-neutral-100 ${ratio} ${rounded}`}>
      {cover && (
        <img
          src={cover}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      )}

      {/* Кадр из самого ролика вместо обложки. #t=0.1 заставляет браузер
          показать картинку, а не чёрный прямоугольник; metadata не тянет
          весь файл ради превью. */}
      {isVideo && (
        <>
          <video
            src={`${article.media_url}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            tabIndex={-1}
            aria-hidden="true"
            className="h-full w-full bg-black object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-black/55 p-4 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="h-6 w-6 fill-current" aria-hidden="true" />
            </span>
          </span>
        </>
      )}

      {/* У звука кадра нет — рисуем спокойную заливку со значком. */}
      {isAudio && (
        <span className="flex h-full w-full items-center justify-center bg-brand-accent/40">
          <Music className="h-10 w-10 text-brand" aria-hidden="true" />
        </span>
      )}

      <div className="absolute left-3 top-3">
        <Badges imageCount={imageCount} mediaType={article.media_type} />
      </div>
    </div>
  );
}

export default function FeedItem({ article, variant = 'card' }) {
  if (!article) return null;

  // Главный материал: на широком экране снимок и текст стоят рядом —
  // так заголовок виден сразу, без прокрутки. На узком всё в столбик.
  // Без обложки колонку под неё не держим: пустая половина экрана
  // выглядит так, будто картинка не загрузилась.
  if (variant === 'hero') {
    const withCover = hasCover(article);

    return (
      <article className="group rounded-3xl border border-neutral-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(16,24,40,0.04)] transition-shadow duration-200 hover:shadow-[0_14px_36px_rgba(27,94,32,0.08)] sm:p-5">
        <Link
          to={`/article/${article.id}`}
          className={`grid gap-5 lg:gap-8 ${withCover ? 'lg:grid-cols-5' : ''}`}
        >
          {withCover && (
            <div className="lg:col-span-3">
              <Cover article={article} ratio="aspect-[16/10]" rounded="rounded-2xl" />
            </div>
          )}

          <div className="flex flex-col justify-center gap-3 lg:col-span-2">
            {article.category && <span className="pill w-fit">{CATEGORY_LABELS[article.category] || article.category}</span>}
            <h2 className="font-serif text-[1.75rem] font-bold leading-[1.15] text-ink transition-colors group-hover:text-brand sm:text-4xl">
              {article.title}
            </h2>
            <p className="text-[15px] leading-relaxed text-neutral-600">
              {excerpt(article.content, 220)}
            </p>
            <Meta article={article} />
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col">
      <Link to={`/article/${article.id}`} className="flex flex-1 flex-col gap-3">
        <Cover article={article} ratio="aspect-[16/10]" rounded="rounded-xl" />

        <h2 className="font-serif text-xl font-bold leading-[1.2] tracking-[-0.015em] text-ink transition-colors group-hover:text-brand">
          {article.title}
        </h2>
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-neutral-600">
          {excerpt(article.content, 160)}
        </p>
      </Link>

      <div className="mt-3">
        <Meta article={article} compact />
      </div>
    </article>
  );
}
