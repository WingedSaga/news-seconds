import useArticleFeed from '../hooks/useArticleFeed';
import CategoryTabs from '../components/CategoryTabs';
import FeedSection from '../components/FeedSection';

export default function Jokes() {
  const feed = useArticleFeed('joke');

  return (
    <div className="space-y-8">
      <CategoryTabs />

      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">Анекдоты</h1>
          <p className="text-sm text-neutral-500">Свежая подборка шуток от читателей нашего издания.</p>
        </div>

        <FeedSection
          feed={feed}
          searchPlaceholder="Поиск по анекдотам..."
          emptyTitle="Анекдотов пока нет"
          emptyDescription="Будьте первым — предложите свой анекдот через форму отправки."
        />
      </section>
    </div>
  );
}
