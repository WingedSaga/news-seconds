import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import api from '../api/axios';
import useArticleFeed from '../hooks/useArticleFeed';
import FeedSection from '../components/FeedSection';
import NewsCard from '../components/NewsCard';
import SkeletonCard from '../components/SkeletonCard';
import { excerpt, formatRelativeDate } from '../utils/format';

// Короткая колонка раздела: три последних материала со ссылкой на полосу.
function SectionColumn({ title, to, items, loading }) {
  return (
    <section className="space-y-3">
      <h2 className="section-title">
        {title}
        <Link
          to={to}
          className="flex items-center gap-1 font-sans text-xs font-semibold normal-case tracking-normal text-brand hover:text-brand-hover"
        >
          Все материалы
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </h2>

      {loading ? (
        <p className="py-4 text-sm text-neutral-400">Загрузка...</p>
      ) : items.length === 0 ? (
        <p className="py-4 text-sm text-neutral-500">В этом разделе пока пусто.</p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="py-3">
              <Link to={`/article/${item.id}`} className="group block">
                <h3 className="font-serif text-lg font-bold leading-tight text-neutral-900 group-hover:text-brand">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">{excerpt(item.content, 110)}</p>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {formatRelativeDate(item.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Home() {
  const feed = useArticleFeed('news');

  const [featured, setFeatured] = useState(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [jokes, setJokes] = useState([]);
  const [weather, setWeather] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/articles/featured')
      .then(({ data }) => {
        if (!cancelled) setFeatured(data.item);
      })
      .catch(() => {
        // Главный материал необязателен: при ошибке полоса просто начинается с ленты.
      })
      .finally(() => {
        if (!cancelled) setFeaturedLoading(false);
      });

    Promise.all([
      api.get('/articles', { params: { category: 'joke', limit: 3 } }),
      api.get('/articles', { params: { category: 'weather', limit: 3 } }),
    ])
      .then(([jokesRes, weatherRes]) => {
        if (cancelled) return;
        setJokes(jokesRes.data.items);
        setWeather(weatherRes.data.items);
      })
      .catch(() => {
        // Нижние полосы второстепенны, ошибку показывает основная лента.
      })
      .finally(() => {
        if (!cancelled) setSectionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-10">
      <section aria-labelledby="lead-heading" className="space-y-4">
        <h2 id="lead-heading" className="section-title">
          Передовица
        </h2>

        {featuredLoading ? (
          <SkeletonCard />
        ) : featured ? (
          <NewsCard article={featured} featured />
        ) : (
          <p className="text-sm text-neutral-500">
            Главный материал появится, как только редакция одобрит первую новость.
          </p>
        )}
      </section>

      <section aria-labelledby="feed-heading" className="space-y-4">
        <h2 id="feed-heading" className="section-title">
          Хроника
        </h2>

        <FeedSection
          feed={feed}
          searchPlaceholder="Поиск по новостям..."
          emptyTitle="Новостей пока нет"
          emptyDescription="Попробуйте изменить поисковый запрос или предложите свою новость."
        />
      </section>

      <div className="grid gap-8 border-t-2 border-neutral-900 pt-8 lg:grid-cols-2">
        <SectionColumn title="Анекдоты" to="/jokes" items={jokes} loading={sectionsLoading} />
        <SectionColumn title="Погода" to="/weather" items={weather} loading={sectionsLoading} />
      </div>
    </div>
  );
}
