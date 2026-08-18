const { supabase } = require('../db/supabase');

// Значения по умолчанию: используются, пока строки нет в базе,
// а также если база временно недоступна — сайт не должен падать из-за настроек.
const DEFAULTS = {
  email_verification: false,
  registration_open: true,
  comments_enabled: true,
  auto_approve_articles: false,
  site_tagline: 'Новости, анекдоты и погода — каждую секунду',
  site_title: 'НОВОСТИ СЕКУНДЫ',
  maintenance_mode: false,
  ads: [],
};

const EDITABLE = Object.keys(DEFAULTS);

const BOOLEAN_KEYS = [
  'email_verification',
  'registration_open',
  'comments_enabled',
  'auto_approve_articles',
  'maintenance_mode',
];

// Настройки читаются почти в каждом запросе, поэтому держим короткий кэш:
// изменение из админ-панели применяется не позже, чем через полминуты,
// а сам кэш сбрасывается сразу при сохранении.
const CACHE_TTL_MS = 30 * 1000;

let cache = null;
let cachedAt = 0;

function normalize(rows) {
  const values = { ...DEFAULTS };

  for (const row of rows || []) {
    if (!(row.key in DEFAULTS)) continue;
    values[row.key] = BOOLEAN_KEYS.includes(row.key) ? Boolean(row.value) : row.value;
  }

  return values;
}

async function getSettings({ force = false } = {}) {
  if (!force && cache && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cache;
  }

  const { data, error } = await supabase.from('settings').select('key, value');

  if (error) {
    console.error('[settings] не удалось прочитать настройки:', error.message);
    return cache || { ...DEFAULTS };
  }

  cache = normalize(data);
  cachedAt = Date.now();
  return cache;
}

async function getSetting(key) {
  const settings = await getSettings();
  return settings[key];
}

async function updateSettings(patch) {
  const rows = Object.entries(patch)
    .filter(([key]) => EDITABLE.includes(key))
    .map(([key, value]) => ({
      key,
      value: BOOLEAN_KEYS.includes(key) ? Boolean(value) : value,
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) return getSettings({ force: true });

  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) throw error;

  return getSettings({ force: true });
}

module.exports = { getSettings, getSetting, updateSettings, DEFAULTS, EDITABLE, BOOLEAN_KEYS };
