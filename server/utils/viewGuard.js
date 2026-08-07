// Один читатель — один просмотр за окно времени. Без этого счётчик рос
// на каждое обновление страницы и ничего не значил.
//
// Отметки живут в памяти процесса: отдельной таблицы не нужно, а после
// перезапуска сервера худшее, что случится, — кто-то досчитается ещё раз.
const WINDOW_MS = 6 * 60 * 60 * 1000;
const MAX_ENTRIES = 50000;

const seen = new Map();

function prune(now) {
  for (const [key, at] of seen) {
    if (now - at > WINDOW_MS) seen.delete(key);
  }
  // Если чистка не помогла (наплыв за короткое время), сбрасываем самые
  // старые записи: лишний просмотр дешевле разрастающейся памяти.
  if (seen.size > MAX_ENTRIES) {
    const excess = seen.size - MAX_ENTRIES;
    let removed = 0;
    for (const key of seen.keys()) {
      seen.delete(key);
      if (++removed >= excess) break;
    }
  }
}

// Кто смотрит: вошедший — по идентификатору, гость — по адресу и браузеру.
function viewerKey(req) {
  if (req.user) return `u:${req.user.id}`;
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  return `a:${ip}|${req.get('user-agent') || ''}`;
}

function shouldCountView(req, articleId) {
  const now = Date.now();
  const key = `${articleId}#${viewerKey(req)}`;
  const last = seen.get(key);

  if (last && now - last <= WINDOW_MS) {
    return false;
  }

  seen.set(key, now);
  prune(now);
  return true;
}

module.exports = { shouldCountView, WINDOW_MS };
