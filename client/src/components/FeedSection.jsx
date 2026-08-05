import { Plus } from 'lucide-react';
import ArticleGrid from './ArticleGrid';
import SkeletonCard from './SkeletonCard';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import ErrorMessage from './ErrorMessage';
import EmptyState from './EmptyState';
import Loader from './Loader';
import { plural } from '../utils/format';

// Лента статей с поиском, пагинацией и кнопкой «Показать ещё».
export default function FeedSection({ feed, searchPlaceholder, emptyTitle, emptyDescription }) {
  const {
    items,
    search,
    setSearch,
    page,
    totalPages,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    goToPage,
    retry,
  } = feed;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:max-w-md sm:flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder={searchPlaceholder} />
        </div>
        {!loading && (
          <p className="text-sm text-neutral-500">
            {total} {plural(total, 'публикация', 'публикации', 'публикаций')}
          </p>
        )}
      </div>

      <ErrorMessage message={error} onRetry={retry} />

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        !error && <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <ArticleGrid articles={items} />

          {loadingMore && <Loader label="Загружаем ещё..." />}

          {hasMore && !loadingMore && (
            <div className="flex justify-center">
              <button type="button" onClick={loadMore} className="btn-outline">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Показать ещё
              </button>
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </>
      )}
    </section>
  );
}
