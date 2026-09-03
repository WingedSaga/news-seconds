const crypto = require('crypto');
const os = require('os');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const { imageUploadLimiter, mediaUploadLimiter } = require('../middleware/rateLimiters');
const {
  uploadImage,
  uploadMedia,
  MEDIA_UPLOAD_LIMIT_BYTES,
} = require('../controllers/uploadController');

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
  imageUploadLimiter,
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
// Принимаем до 100 МБ; всё, что не влезает в хранилище, сервер пережимает
// сам — см. services/mediaCompressor.
// Держать сотню мегабайт в памяти на Raspberry Pi расточительно, да и
// ffmpeg всё равно работает с файлом на диске.
const uploadMediaFile = multer({
  storage: multer.diskStorage({
    destination: os.tmpdir(),
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname).slice(0, 10) || '.bin';
      cb(null, `ns-upload-${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
  }),
  limits: { fileSize: MEDIA_UPLOAD_LIMIT_BYTES },
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
  mediaUploadLimiter,
  (req, res, next) => {
    uploadMediaFile.single('media')(req, res, (err) => {
      if (!err) return next();
      const message =
        err.code === 'LIMIT_FILE_SIZE' ? 'Файл больше 100 МБ' : err.message || 'Ошибка загрузки файла';
      return res.status(400).json({ message });
    });
  },
  uploadMedia
);

module.exports = router;
