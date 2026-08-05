import { CloudSun } from 'lucide-react';
import useArticleFeed from '../hooks/useArticleFeed';
import CategoryTabs from '../components/CategoryTabs';
import FeedSection from '../components/FeedSection';

export default function Weather() {
  const feed = useArticleFeed('weather');

  return (
    <div className="space-y-8">
      <CategoryTabs />

      <section className="space-y-4">
        <div className="card flex items-start gap-4 p-5">
          <span className="rounded-md bg-brand-accent p-3 text-brand-dark">
            <CloudSun className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900">Погода</h1>
            <p className="text-sm text-neutral-500">
              Прогнозы, наблюдения и погодные сводки от редакции и читателей.
            </p>
          </div>
        </div>

        <FeedSection
          feed={feed}
          searchPlaceholder="Поиск по погодным сводкам..."
          emptyTitle="Погодных сводок пока нет"
          emptyDescription="Как только редакция одобрит первую сводку, она появится здесь."
        />
      </section>
    </div>
  );
}
