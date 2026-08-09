export const CATEGORY_LABELS = {
  news: 'Новости',
  joke: 'Анекдоты',
  weather: 'Погода',
  other: 'Другое',
};

export const STATUS_LABELS = {
  pending: 'На модерации',
  approved: 'Одобрено',
  rejected: 'Отклонено',
};

export const STATUS_CLASSES = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-brand-accent text-brand-dark',
  rejected: 'bg-red-100 text-red-700',
};

// «5 минут назад», «вчера», «12 марта 2026»
export function formatRelativeDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) return 'только что';
  if (diffMinutes < 60) return `${diffMinutes} ${plural(diffMinutes, 'минуту', 'минуты', 'минут')} назад`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ${plural(diffHours, 'час', 'часа', 'часов')} назад`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} ${plural(diffDays, 'день', 'дня', 'дней')} назад`;

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatViews(count) {
  const value = Number(count) || 0;
  return `${value} ${plural(value, 'просмотр', 'просмотра', 'просмотров')}`;
}

export function plural(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export function excerpt(text, length = 160) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length)}…` : clean;
}

// Инициалы для запасного аватара.
export function initials(name) {
  const value = String(name || '').trim();
  if (!value) return '?';
  return value.slice(0, 2).toUpperCase();
}
