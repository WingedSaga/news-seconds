const crypto = require('crypto');
const { supabase, STORAGE_BUCKET } = require('../db/supabase');

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
async function uploadMedia(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не передан' });
    }

    const format = MEDIA_EXTENSIONS[req.file.mimetype];
    if (!format) {
      return res.status(400).json({ message: 'Поддерживаются только MP3 и MP4' });
    }

    const bucket = process.env.SUPABASE_MEDIA_BUCKET || 'article-media';
    const path = `${req.user.id}/${Date.now()}-${crypto.randomUUID()}.${format.ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    res.status(201).json({ url: data.publicUrl, media_type: format.kind, path });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadImage, uploadMedia };
