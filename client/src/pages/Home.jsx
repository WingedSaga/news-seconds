import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import api from '../api/axios';
import useArticleFeed from '../hooks/useArticleFeed';
import FeedSection from '../components/FeedSection';
import NewsCard from '../components/NewsCard';
import SkeletonCard from '../components/SkeletonCard';
import { excerpt, formatRelativeDate } from '../utils/format';

// Врезка «Коротко»: узкая колонка заголовков сбоку от передовицы,
// как боковая колонка новостей на первой полосе.
function BriefColumn({ items, loading }) {
  return (
    <aside className="lg:border-l lg:border-neutral-300 lg:pl-6">
      <h2 className="mb-3 border-b-2 border-ink pb-2 font-serif text-sm font-black uppercase tracking-[0.18em] text-ink">
        Коротко
      </h2>

      {loading ? (
        <p className="py-3 text-sm text-neutral-400">Загрузка...</p>
      ) : items.length === 0 ? (
        <p className="py-3 text-sm text-neutral-500">Свежих сообщений пока нет.</p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="py-2.5">
              <Link to={`/article/${item.id}`} className="group block">
                <h3 className="font-serif text-[15px] font-bold leading-snug text-ink group-hover:text-brand">
                  {item.title}
                </h3>
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-400">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {formatRelativeDate(item.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

// Полоса раздела внизу первой страницы.
function SectionColumn({ title, to, items, loading }) {
  return (
    <section className="space-y-3">
      <h2 className="section-title text-base">
        {title}
        <Link
          to={to}
          className="flex items-center gap-1 font-sans text-[11px] font-semibold normal-case tracking-normal text-brand hover:text-brand-hover"
        >
          Все материалы
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </h2>

      {loading ? (
        <p className="py-3 text-sm text-neutral-400">Загрузка...</p>
      ) : items.length === 0 ? (
        <p className="py-3 text-sm text-neutral-500">В этом разделе пока пусто.</p>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="py-3">
              <Link to={`/article/${item.id}`} className="group block">
                <h3 className="font-serif text-lg font-bold leading-tight text-ink group-hover:text-brand">
                  {item.title}
                </h3>
                <p className="mt-1 font-serif text-sm leading-snug text-neutral-600">
                  {excerpt(item.content, 110)}
                </p>
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
  const [brief, setBrief] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [jokes, setJokes] = useState([]);
  const [weather, setWeather] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get('/articles/featured'),
      api.get('/articles', { params: { category: 'news', limit: 6 } }),
    ])
      .then(([featuredRes, latestRes]) => {
        if (cancelled) return;
        setFeatured(featuredRes.data.item);
        // Передовицу во врезке не повторяем.
        setBrief(
          latestRes.data.items
            .filter((item) => item.id !== featuredRes.data.item?.id)
            .slice(0, 5)
        );
      })
      .catch(() => {
        // Первая полоса необязательна: ошибку показывает основная лента.
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
        // Нижние полосы второстепенны.
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

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div>
            {featuredLoading ? (
              <SkeletonCard />
            ) : featured ? (
              <NewsCard article={featured} featured />
            ) : (
              <p className="border-y border-neutral-300 py-10 text-center font-serif text-neutral-500">
                Главный материал появится, как только редакция одобрит первую новость.
              </p>
            )}
          </div>

          <BriefColumn items={brief} loading={featuredLoading} />
        </div>
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

      <div className="grid gap-8 border-t-2 border-ink pt-8 lg:grid-cols-2">
        <SectionColumn title="Анекдоты" to="/jokes" items={jokes} loading={sectionsLoading} />
        <div className="lg:border-l lg:border-neutral-300 lg:pl-8">
          <SectionColumn title="Погода" to="/weather" items={weather} loading={sectionsLoading} />
        </div>
      </div>
    </div>
  );
}
