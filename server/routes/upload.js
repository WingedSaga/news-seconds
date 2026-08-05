const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadImage } = require('../controllers/uploadController');

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

module.exports = router;
