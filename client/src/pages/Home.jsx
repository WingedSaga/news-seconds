import { useEffect, useState } from 'react';
import api from '../api/axios';
import useArticleFeed from '../hooks/useArticleFeed';
import FeedSection from '../components/FeedSection';
import NewsCard from '../components/NewsCard';
import SkeletonCard from '../components/SkeletonCard';

export default function Home() {
  const feed = useArticleFeed('news');
  const [featured, setFeatured] = useState(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/articles/featured')
      .then(({ data }) => {
        if (!cancelled) setFeatured(data.item);
      })
      .catch(() => {
        // Главный материал необязателен — при ошибке просто не показываем блок.
      })
      .finally(() => {
        if (!cancelled) setFeaturedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <section aria-labelledby="featured-heading" className="space-y-4">
        <h2 id="featured-heading" className="text-xl font-extrabold text-neutral-900">
          Главное сейчас
        </h2>

        {featuredLoading ? (
          <SkeletonCard />
        ) : featured ? (
          <NewsCard article={featured} featured />
        ) : (
          <p className="text-sm text-neutral-500">Главная новость появится, как только редакция её одобрит.</p>
        )}
      </section>

      <section aria-labelledby="feed-heading" className="space-y-4">
        <h2 id="feed-heading" className="text-xl font-extrabold text-neutral-900">
          Лента новостей
        </h2>

        <FeedSection
          feed={feed}
          searchPlaceholder="Поиск по новостям..."
          emptyTitle="Новостей пока нет"
          emptyDescription="Попробуйте изменить поисковый запрос или предложите свою новость."
        />
      </section>
    </div>
  );
}
