import { Link } from 'react-router-dom';
import { Clock, Eye, ImageOff, Images, Music, Video } from 'lucide-react';
import Avatar from './Avatar';
import { CATEGORY_LABELS, excerpt, formatRelativeDate } from '../utils/format';

export default function NewsCard({ article, featured = false }) {
  if (!article) return null;

  const { id, title, content, category, image_url, image_urls, media_url, media_type, views, created_at, author } =
    article;

  const imageCount = image_urls?.length || (image_url ? 1 : 0);

  return (
    <article
      className={`group flex ${featured ? 'flex-col gap-5 lg:flex-row' : 'flex-col gap-3'}`}
    >
      <Link
        to={`/article/${id}`}
        className={`relative block shrink-0 overflow-hidden bg-neutral-100 ${
          featured ? 'h-64 sm:h-80 lg:h-auto lg:w-1/2' : 'h-40'
        }`}
      >
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-neutral-300">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill w-fit">{CATEGORY_LABELS[category] || category}</span>
          {imageCount > 1 && (
            <span className="pill-accent inline-flex items-center gap-1">
              <Images className="h-3 w-3" aria-hidden="true" />
              {imageCount} фото
            </span>
          )}
          {media_url && (
            <span className="pill-accent inline-flex items-center gap-1">
              {media_type === 'video' ? (
                <Video className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Music className="h-3 w-3" aria-hidden="true" />
              )}
              {media_type === 'video' ? 'Видео' : 'Аудио'}
            </span>
          )}
        </div>

        <h3
          className={`font-serif font-bold leading-[1.15] text-ink ${
            featured ? 'text-3xl lg:text-[2.75rem]' : 'text-xl'
          }`}
        >
          <Link to={`/article/${id}`} className="hover:text-brand">
            {title}
          </Link>
        </h3>

        <p
          className={`font-serif text-neutral-700 ${
            featured ? 'line-clamp-4 text-lg leading-relaxed' : 'line-clamp-3 text-[15px] leading-snug'
          }`}
        >
          {excerpt(content, featured ? 280 : 140)}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutral-200 pt-2 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatRelativeDate(created_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {views ?? 0}
          </span>
          <span className="flex items-center gap-2">
            <Avatar user={author} size="sm" />
            {author?.username || 'Аноним'}
          </span>
        </div>
      </div>
    </article>
  );
}
