import NewsCard from './NewsCard';

// Сетка новостей: три колонки на десктопе, две на планшете, одна на телефоне.
export default function ArticleGrid({ articles }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, index) => (
        <div
          key={article.id}
          /* Вертикальные линейки между колонками — как разделители полос. */
          className={
            index % 3 !== 0
              ? 'lg:border-l lg:border-neutral-200 lg:pl-6'
              : index % 2 !== 0
                ? 'sm:border-l sm:border-neutral-200 sm:pl-6 lg:border-l-0 lg:pl-0'
                : ''
          }
        >
          <NewsCard article={article} />
        </div>
      ))}
    </div>
  );
}
