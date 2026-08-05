import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/axios';

const PAGE_SIZE = 9;

// Общая логика ленты: поиск с задержкой, страницы и кнопка «Показать ещё».
export default function useArticleFeed(category) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Отличает дозагрузку («Показать ещё») от обычной смены страницы.
  const appendRef = useRef(false);
  const requestId = useRef(0);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Новый поисковый запрос или смена категории — возвращаемся на первую страницу.
  useEffect(() => {
    appendRef.current = false;
    setPage(1);
  }, [debouncedSearch, category]);

  useEffect(() => {
    const append = appendRef.current;
    appendRef.current = false;

    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    if (append) setLoadingMore(true);
    else setLoading(true);
    setError('');

    api
      .get('/articles', {
        params: {
          page,
          limit: PAGE_SIZE,
          ...(category ? { category } : {}),
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        },
      })
      .then(({ data }) => {
        // Отбрасываем ответ, если за это время ушёл более свежий запрос.
        if (requestId.current !== currentRequest) return;
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotalPages(data.totalPages);
        setTotal(data.total);
        setHasMore(data.hasMore);
      })
      .catch((err) => {
        if (requestId.current === currentRequest) setError(err.message);
      })
      .finally(() => {
        if (requestId.current !== currentRequest) return;
        setLoading(false);
        setLoadingMore(false);
      });
  }, [category, debouncedSearch, page, reloadToken]);

  const loadMore = useCallback(() => {
    appendRef.current = true;
    setPage((prev) => prev + 1);
  }, []);

  const goToPage = useCallback(
    (next) => {
      if (next < 1 || next > totalPages || next === page) return;
      appendRef.current = false;
      setPage(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [page, totalPages]
  );

  const retry = useCallback(() => {
    appendRef.current = false;
    setReloadToken((token) => token + 1);
  }, []);

  return {
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
  };
}
