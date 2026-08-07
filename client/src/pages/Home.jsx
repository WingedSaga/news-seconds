import { Loader2, Plus, Search, X } from 'lucide-react';
import useArticleFeed from '../hooks/useArticleFeed';
import FeedItem from '../components/FeedItem';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

// Заглушка на время загрузки, повторяющая ритм самой ленты.
function FeedSkeleton() {
  return (
    <div className="space-y-12" aria-hidden="true">
      <div className="animate-pulse space-y-4">
        <div className="aspect-[16/9] w-full rounded-2xl bg-neutral-200" />
        <div className="h-9 w-3/4 rounded bg-neutral-200" />
        <div className="h-4 w-full rounded bg-neutral-100" />
      </div>

      <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="animate-pulse space-y-3">
            <div className="aspect-[16/10] w-full rounded-xl bg-neutral-200" />
            <div className="h-5 w-4/5 rounded bg-neutral-200" />
            <div className="h-4 w-full rounded bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  // Категория не передаётся: лента показывает всё, что одобрила редакция.
  const { items, search, setSearch, hasMore, loading, loadingMore, error, loadMore, retry } =
    useArticleFeed();

  const [lead, ...rest] = items;

  return (
    <div className="mx-auto max-w-6xl">
      {/* Заголовок и поиск в одной строке: поле перестаёт висеть посреди
          пустоты и сразу читается как часть ленты. */}
      <div className="mb-8 flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Лента
        </h1>

        <div className="relative sm:w-80">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по материалам"
            aria-label="Поиск"
            className="w-full rounded-full border border-neutral-300 bg-white py-2.5 pl-10 pr-10 text-sm
              transition-colors placeholder:text-neutral-400 focus:border-brand focus:outline-none
              focus:ring-2 focus:ring-brand/25"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Очистить поиск"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
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
        <div className="space-y-12">
          <FeedItem article={lead} variant="hero" />

          {rest.length > 0 && (
            <div className="grid gap-x-8 gap-y-10 border-t border-neutral-200 pt-10 md:grid-cols-2">
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
            <div className="flex justify-center">
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
            <p className="text-center text-sm text-neutral-400">Это все материалы</p>
          )}
        </div>
      )}
    </div>
  );
}
