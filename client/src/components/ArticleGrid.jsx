import NewsCard from './NewsCard';

// Сетка новостей: три колонки на десктопе, две на планшете, одна на телефоне.
export default function ArticleGrid({ articles }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
}
