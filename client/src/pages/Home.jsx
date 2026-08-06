import { Loader2, Plus, Search, X } from 'lucide-react';
import useArticleFeed from '../hooks/useArticleFeed';
import FeedItem from '../components/FeedItem';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

// Заглушка на время загрузки, повторяющая ритм самой ленты.
function FeedSkeleton() {
  return (
    <div className="space-y-10" aria-hidden="true">
      <div className="animate-pulse space-y-4">
        <div className="h-64 w-full rounded-2xl bg-neutral-200 sm:h-96" />
        <div className="h-9 w-3/4 rounded bg-neutral-200" />
        <div className="h-4 w-full rounded bg-neutral-100" />
        <div className="h-4 w-5/6 rounded bg-neutral-100" />
      </div>

      {[0, 1, 2].map((index) => (
        <div key={index} className="flex animate-pulse gap-5">
          <div className="flex-1 space-y-3">
            <div className="h-6 w-4/5 rounded bg-neutral-200" />
            <div className="h-4 w-full rounded bg-neutral-100" />
            <div className="h-4 w-2/3 rounded bg-neutral-100" />
          </div>
          <div className="h-36 w-56 shrink-0 rounded-xl bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  // Категория не передаётся: лента показывает всё, что одобрила редакция.
  const { items, search, setSearch, hasMore, loading, loadingMore, error, loadMore, retry } =
    useArticleFeed();

  const [lead, ...rest] = items;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative mb-10">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по материалам"
          aria-label="Поиск"
          className="w-full rounded-full border border-neutral-300 bg-white py-3 pl-11 pr-11 text-[15px]
            placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Очистить поиск"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <ErrorMessage message={error} onRetry={retry} />

      {loading ? (
        <FeedSkeleton />
      ) : items.length === 0 ? (
        !error && (
          <EmptyState
            title={search ? 'Ничего не найдено' : 'Пока пусто'}
            description={
              search
                ? 'Попробуйте другой запрос.'
                : 'Первые материалы появятся, как только редакция их одобрит.'
            }
          />
        )
      ) : (
        <div className="space-y-10">
          <FeedItem article={lead} variant="hero" />

          {rest.length > 0 && (
            <div className="space-y-10 border-t border-neutral-200 pt-10">
              {rest.map((article) => (
                <FeedItem key={article.id} article={article} />
              ))}
            </div>
          )}

          {loadingMore && (
            <p className="flex items-center justify-center gap-2 py-4 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden="true" />
              Загружаем ещё
            </p>
          )}

          {hasMore && !loadingMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={loadMore}
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-2.5
                  text-sm font-semibold text-neutral-700 transition-colors hover:border-brand hover:text-brand"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Показать ещё
              </button>
            </div>
          )}

          {!hasMore && (
            <p className="pt-4 text-center text-sm text-neutral-400">Это все материалы</p>
          )}
        </div>
      )}
    </div>
  );
}
