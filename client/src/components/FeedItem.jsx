import { Link } from 'react-router-dom';
import { Clock, Eye, Images, Music, Video } from 'lucide-react';
import Avatar from './Avatar';
import { excerpt, formatRelativeDate } from '../utils/format';

// Метки вложений: показывают, что внутри, не называя раздела.
function Badges({ imageCount, mediaType }) {
  if (imageCount < 2 && !mediaType) return null;

  return (
    <div className="flex items-center gap-2">
      {imageCount > 1 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur">
          <Images className="h-3 w-3" aria-hidden="true" />
          {imageCount}
        </span>
      )}
      {mediaType && (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur">
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

function Meta({ article }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-neutral-500">
      <span className="flex items-center gap-2">
        <Avatar user={article.author} size="sm" />
        <span className="font-medium text-neutral-700">{article.author?.username || 'Аноним'}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {formatRelativeDate(article.created_at)}
      </span>
      <span className="flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        {article.views ?? 0}
      </span>
    </div>
  );
}

export default function FeedItem({ article, variant = 'default' }) {
  if (!article) return null;

  const imageCount = article.image_urls?.length || (article.image_url ? 1 : 0);
  const cover = article.image_urls?.[0] || article.image_url;

  // Первый материал в ленте подаётся крупно, во всю ширину колонки.
  if (variant === 'hero') {
    return (
      <article className="group">
        <Link to={`/article/${article.id}`} className="block space-y-4">
          {cover && (
            <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
              <img
                src={cover}
                alt={article.title}
                className="h-64 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] sm:h-[26rem]"
              />
              <div className="absolute left-4 top-4">
                <Badges imageCount={imageCount} mediaType={article.media_type} />
              </div>
            </div>
          )}

          <h2 className="font-serif text-3xl font-bold leading-[1.15] text-ink transition-colors group-hover:text-brand sm:text-[2.6rem]">
            {article.title}
          </h2>

          <p className="font-serif text-lg leading-relaxed text-neutral-600">
            {excerpt(article.content, 240)}
          </p>
        </Link>

        <div className="mt-4">
          <Meta article={article} />
        </div>
      </article>
    );
  }

  return (
    <article className="group">
      <Link to={`/article/${article.id}`} className="flex flex-col gap-5 sm:flex-row-reverse sm:items-start">
        {cover && (
          <div className="relative shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:w-56">
            <img
              src={cover}
              alt={article.title}
              loading="lazy"
              className="h-48 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 sm:h-36"
            />
            <div className="absolute left-2 top-2">
              <Badges imageCount={imageCount} mediaType={article.media_type} />
            </div>
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="font-serif text-2xl font-bold leading-snug text-ink transition-colors group-hover:text-brand">
            {article.title}
          </h2>
          <p className="line-clamp-2 text-[15px] leading-relaxed text-neutral-600">
            {excerpt(article.content, 180)}
          </p>
          <Meta article={article} />
        </div>
      </Link>
    </article>
  );
}
