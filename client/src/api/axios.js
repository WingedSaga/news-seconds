import axios from 'axios';

export const TOKEN_KEY = 'ns_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: { 'Content-Type': 'application/json' },
  // Бесплатный тариф хостинга усыпляет сервис после простоя: первый запрос
  // ждёт пробуждения контейнера, это заметно дольше обычного ответа.
  timeout: 60000,
});

// Подставляем JWT из localStorage в каждый запрос.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Приводим любую ошибку к объекту с полем message на русском языке.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Токен протух или отозван — выходим и отправляем на страницу входа.
      if (status === 401 && localStorage.getItem(TOKEN_KEY)) {
        localStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(new CustomEvent('ns:unauthorized'));
      }

      error.message = data?.message || 'Не удалось выполнить запрос';
      error.fieldErrors = data?.errors || [];
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Превышено время ожидания ответа сервера';
    } else {
      error.message = 'Сервер недоступен. Проверьте подключение к интернету.';
    }

    return Promise.reject(error);
  }
);

export default api;
