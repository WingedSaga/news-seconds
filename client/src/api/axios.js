import axios from 'axios';
import { readStorage, removeStorage } from '../utils/storage';

export const TOKEN_KEY = 'ns_token';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
// Запасной прямой маршрут для Safari/iOS, когда браузер или сеть режет workers.dev.
// Он ведёт в тот же API на Raspberry Pi через исходящий Cloudflare Tunnel.
const FALLBACK_API_URL = 'https://adopted-cart-cowboy-diet.trycloudflare.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  // Бесплатный тариф хостинга усыпляет сервис после простоя: первый запрос
  // ждёт пробуждения контейнера, это заметно дольше обычного ответа.
  timeout: 60000,
});

// Подставляем JWT из localStorage в каждый запрос.
api.interceptors.request.use((config) => {
  const token = readStorage(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Приводим любую ошибку к объекту с полем message на русском языке.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestConfig = error.config;
    // Workers.dev иногда отвечает 52x, хотя сам API на Raspberry Pi жив.
    // В таком случае повторяем запрос через прямой HTTPS-туннель, как и при
    // сетевой ошибке браузера. Ошибки 4xx не повторяем: это уже ответ API.
    const shouldUseFallback = !error.response || error.response.status >= 500;
    if (shouldUseFallback && requestConfig && !requestConfig.__usedFallback && requestConfig.baseURL !== FALLBACK_API_URL) {
      return api({
        ...requestConfig,
        baseURL: FALLBACK_API_URL,
        __usedFallback: true,
      });
    }

    if (error.response) {
      const { status, data } = error.response;

      // Токен протух или отозван — выходим и отправляем на страницу входа.
      if (status === 401 && readStorage(TOKEN_KEY)) {
        removeStorage(TOKEN_KEY);
        window.dispatchEvent(new CustomEvent('ns:unauthorized'));
      }

      error.message = data?.message || 'Не удалось выполнить запрос';
      error.fieldErrors = data?.errors || [];
    } else if (error.code === 'ECONNABORTED') {
      error.message = 'Превышено время ожидания ответа сервера';
    } else {
      error.message = 'Не удалось связаться с сервером. Возможно, браузер заблокировал запрос к API.';
    }

    return Promise.reject(error);
  }
);

export default api;
