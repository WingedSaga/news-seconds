const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadImage, uploadMedia } = require('../controllers/uploadController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Допустимы только изображения'));
    }
    cb(null, true);
  },
});

router.post(
  '/',
  authMiddleware,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (!err) return next();
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Файл больше 5 МБ' : err.message || 'Ошибка загрузки файла';
      return res.status(400).json({ message });
    });
  },
  uploadImage
);

// Аудио и видео заметно тяжелее картинок, поэтому лимит отдельный.
// 50 МБ — предел одного файла в Supabase Storage на бесплатном тарифе.
const MEDIA_LIMIT_BYTES = 50 * 1024 * 1024;

const uploadMediaFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MEDIA_LIMIT_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!['audio/mpeg', 'audio/mp3', 'video/mp4'].includes(file.mimetype)) {
      return cb(new Error('Допустимы только файлы MP3 и MP4'));
    }
    cb(null, true);
  },
});

router.post(
  '/media',
  authMiddleware,
  (req, res, next) => {
    uploadMediaFile.single('media')(req, res, (err) => {
      if (!err) return next();
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Файл больше 50 МБ' : err.message || 'Ошибка загрузки файла';
      return res.status(400).json({ message });
    });
  },
  uploadMedia
);

module.exports = router;
