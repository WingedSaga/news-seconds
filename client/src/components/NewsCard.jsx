import { Link } from 'react-router-dom';
import { Clock, Eye, ImageOff } from 'lucide-react';
import Avatar from './Avatar';
import { CATEGORY_LABELS, excerpt, formatRelativeDate } from '../utils/format';

export default function NewsCard({ article, featured = false }) {
  if (!article) return null;

  const { id, title, content, category, image_url, views, created_at, author } = article;

  return (
    <article
      className={`card group flex overflow-hidden transition-shadow hover:shadow-md ${
        featured ? 'flex-col lg:flex-row' : 'flex-col'
      }`}
    >
      <Link
        to={`/article/${id}`}
        className={`relative block shrink-0 overflow-hidden bg-neutral-100 ${
          featured ? 'h-56 lg:h-auto lg:w-1/2' : 'h-44'
        }`}
      >
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-neutral-300">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
          </span>
        )}
      </Link>

      <div className={`flex flex-1 flex-col gap-3 p-4 ${featured ? 'lg:p-6' : ''}`}>
        <span className="pill w-fit">{CATEGORY_LABELS[category] || category}</span>

        <h3
          className={`font-serif font-bold leading-tight text-neutral-900 ${
            featured ? 'text-3xl lg:text-4xl' : 'text-xl'
          }`}
        >
          <Link to={`/article/${id}`} className="hover:text-brand">
            {title}
          </Link>
        </h3>

        <p className={`text-sm text-neutral-600 ${featured ? 'line-clamp-4' : 'line-clamp-3'}`}>
          {excerpt(content, featured ? 280 : 140)}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs text-neutral-500">
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
