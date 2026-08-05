const crypto = require('crypto');
const { supabase, STORAGE_BUCKET } = require('../db/supabase');

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

module.exports = { uploadImage };
