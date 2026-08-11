const { supabase } = require('./supabase');

// Колонки статей, добавленные миграциями. Если база отстала от кода,
// запрашивать их нельзя — PostgREST отвечает ошибкой на весь запрос,
// и лента падает целиком. Поэтому один раз проверяем, что есть,
// и дальше собираем список полей по факту.
const OPTIONAL_ARTICLE_COLUMNS = ['image_urls', 'media_url', 'media_type', 'moderation_note', 'moderated_at', 'is_featured'];

const BASE_ARTICLE_COLUMNS = [
  'id',
  'title',
  'content',
  'category',
  'image_url',
  'author_id',
  'status',
  'views',
  'created_at',
];

const AUTHOR_SELECT = 'author:users (id, username, avatar_url)';

// До проверки считаем, что колонок нет. Лишний раз не запросить поле
// не страшно — оно появится через секунду; а запросить отсутствующее
// значит уронить весь запрос, что и приводило к ошибкам 500.
const available = new Set();
let detected = false;

async function detectArticleColumns() {
  for (const column of OPTIONAL_ARTICLE_COLUMNS) {
    const { error } = await supabase.from('articles').select(column).limit(1);
    if (error) {
      available.delete(column);
      console.warn(`[schema] колонка articles.${column} недоступна, работаем без неё`);
    } else {
      available.add(column);
    }
  }
  detected = true;
  return available;
}

// Ответы на комментарии тоже пришли миграцией. Логика та же: пока
// колонки нет, ветку не запрашиваем и не пишем, комментарии при этом
// продолжают работать как плоский список.
let commentParent = false;

async function detectCommentColumns() {
  const { error } = await supabase.from('comments').select('parent_id').limit(1);
  commentParent = !error;

  if (error) {
    console.warn('[schema] колонка comments.parent_id недоступна, ответы на комментарии выключены');
  }

  return commentParent;
}

const BASE_COMMENT_COLUMNS = ['id', 'article_id', 'user_id', 'text', 'created_at'];

function commentSelect() {
  const columns = [...BASE_COMMENT_COLUMNS];
  if (commentParent) columns.push('parent_id');
  return `${columns.join(', ')}, ${AUTHOR_SELECT}`;
}

function articleSelect() {
  const columns = [
    ...BASE_ARTICLE_COLUMNS,
    ...OPTIONAL_ARTICLE_COLUMNS.filter((column) => available.has(column)),
  ];
  return `${columns.join(', ')}, ${AUTHOR_SELECT}`;
}

// Поля, которых нет в базе, нельзя и записывать.
function pickWritableColumns(payload) {
  const result = {};
  for (const [key, value] of Object.entries(payload)) {
    if (OPTIONAL_ARTICLE_COLUMNS.includes(key) && !available.has(key)) continue;
    result[key] = value;
  }
  return result;
}

module.exports = {
  detectArticleColumns,
  detectCommentColumns,
  articleSelect,
  commentSelect,
  pickWritableColumns,
  hasArticleColumn: (column) => available.has(column),
  isDetected: () => detected,
  repliesEnabled: () => commentParent,
};
