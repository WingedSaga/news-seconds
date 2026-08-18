const express = require('express');
const { getSettings } = require('../services/settings');

const router = express.Router();

// GET /api/settings — то, что клиенту нужно знать до авторизации.
// Отдаём только безопасный минимум, остальные настройки закрыты админ-панелью.
router.get('/', async (_req, res, next) => {
  try {
    const values = await getSettings();
    res.json({
      site_title: values.site_title,
      site_tagline: values.site_tagline,
      registration_open: values.registration_open,
      comments_enabled: values.comments_enabled,
      ads: values.ads,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
