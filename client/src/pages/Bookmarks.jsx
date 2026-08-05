import { useCallback, useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import api from '../api/axios';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import ArticleGrid from '../components/ArticleGrid';

export default function Bookmarks() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return api
      .get('/articles/bookmarks/list')
      .then(({ data }) => setItems(data.items))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-neutral-900">Закладки</h1>
        <p className="text-sm text-neutral-500">Материалы, которые вы сохранили, чтобы прочитать позже.</p>
      </div>

      <ErrorMessage message={error} onRetry={load} />

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        !error && (
          <EmptyState
            title="Закладок пока нет"
            description="Откройте любую новость и нажмите «В закладки», чтобы сохранить её."
            icon={Bookmark}
          />
        )
      ) : (
        <ArticleGrid articles={items} />
      )}
    </div>
  );
}
