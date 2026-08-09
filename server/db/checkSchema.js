const { supabase } = require('./supabase');

// Колонки, появившиеся в миграциях. Если база отстала от кода, запросы
// падают с невнятной «внутренней ошибкой сервера», поэтому проверяем
// схему на старте и пишем в лог, какую миграцию нужно выполнить.
const EXPECTED = [
  { table: 'articles', column: 'image_urls', migration: '006_article_images.sql' },
  { table: 'articles', column: 'media_url', migration: '005_article_media.sql' },
  { table: 'users', column: 'email_verified', migration: '001_email_verification.sql' },
  { table: 'settings', column: 'key', migration: '002_settings_and_admin.sql' },
  { table: 'admin_actions', column: 'action', migration: '003_admin_tools.sql' },
  { table: 'support_tickets', column: 'status', migration: '004_support.sql' },
  { table: 'comments', column: 'parent_id', migration: '008_comment_replies.sql' },
];

async function checkSchema() {
  const missing = [];

  for (const item of EXPECTED) {
    const { error } = await supabase.from(item.table).select(item.column).limit(1);
    if (error) missing.push({ ...item, reason: error.message });
  }

  if (missing.length === 0) {
    console.log('[schema] структура базы соответствует коду');
    return { ok: true };
  }

  console.error('[schema] база отстаёт от кода, часть запросов будет падать:');
  for (const item of missing) {
    console.error(`[schema]   нет ${item.table}.${item.column} — выполните server/db/migrations/${item.migration}`);
  }

  return { ok: false, missing };
}

module.exports = { checkSchema };
