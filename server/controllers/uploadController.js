const crypto = require('crypto');
const fs = require('fs/promises');
const { supabase, STORAGE_BUCKET } = require('../db/supabase');
const { compressAudio, compressVideo, remove } = require('../services/mediaCompressor');

// Сколько принимаем от браузера.
const MEDIA_UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024;

// Сколько согласно принять хранилище. На бесплатном тарифе Supabase это
// 50 МБ на файл; на платном предел выше и задаётся переменной окружения.
const MEDIA_STORE_LIMIT_BYTES =
  Number(process.env.SUPABASE_MEDIA_MAX_BYTES) || 50 * 1024 * 1024;

function megabytes(bytes) {
  return Math.round(bytes / 1048576);
}

const MEDIA_EXTENSIONS = {
  'audio/mpeg': { ext: 'mp3', kind: 'audio' },
  'audio/mp3': { ext: 'mp3', kind: 'audio' },
  'video/mp4': { ext: 'mp4', kind: 'video' },
};

const EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

// POST /api/upload — загрузка картинки статьи в Supabase Storage.
async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл изображения не передан' });
    }

    const extension = EXTENSIONS[req.file.mimetype];
    if (!extension) {
      return res.status(400).json({ message: 'Поддерживаются только JPG, PNG, WEBP и GIF' });
    }

    const path = `${req.user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    res.status(201).json({ url: data.publicUrl, path });
  } catch (err) {
    next(err);
  }
}

// POST /api/upload/media — аудио и видео к новости.
// Файл лежит на диске: сотня мегабайт в памяти Raspberry Pi ни к чему,
// а ffmpeg всё равно читает с диска.
async function uploadMedia(req, res, next) {
  const original = req.file?.path;
  let compressed = null;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не передан' });
    }

    const format = MEDIA_EXTENSIONS[req.file.mimetype];
    if (!format) {
      return res.status(400).json({ message: 'Поддерживаются только MP3 и MP4' });
    }

    let source = original;
    let note = null;

    if (req.file.size > MEDIA_STORE_LIMIT_BYTES) {
      const target = MEDIA_STORE_LIMIT_BYTES;
      compressed =
        format.kind === 'video'
          ? await compressVideo(original, target)
          : await compressAudio(original, target);

      if (!compressed) {
        return res.status(413).json({
          message:
            `Файл весит ${megabytes(req.file.size)} МБ, а сжать его до ` +
            `${megabytes(target)} МБ не удалось. Загрузите более короткую запись.`,
        });
      }

      source = compressed.path;
      note = `Файл сжат до ${compressed.label}, ${megabytes(compressed.size)} МБ`;
    }

    const buffer = await fs.readFile(source);
    const bucket = process.env.SUPABASE_MEDIA_BUCKET || 'article-media';
    const storagePath = `${req.user.id}/${Date.now()}-${crypto.randomUUID()}.${format.ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, { contentType: req.file.mimetype, upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    res.status(201).json({
      url: data.publicUrl,
      media_type: format.kind,
      path: storagePath,
      ...(note ? { note } : {}),
    });
  } catch (err) {
    next(err);
  } finally {
    // Временные файлы убираем в любом случае: иначе диск Pi забьётся
    // за десяток загрузок.
    await remove(original);
    await remove(compressed?.path);
  }
}

module.exports = { uploadImage, uploadMedia, MEDIA_UPLOAD_LIMIT_BYTES, MEDIA_STORE_LIMIT_BYTES };
