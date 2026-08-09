const { supabase } = require('../db/supabase');

// POST /api/reports — жалобу может отправить только вошедший пользователь;
// так запись остаётся проверяемой и не превращается в анонимный спам-канал.
async function createReport(req, res, next) {
  try {
    const { target_type, target_id, reason } = req.body;

    const { error } = await supabase.from('content_reports').insert({
      reporter_id: req.user.id,
      target_type,
      target_id,
      reason: reason ? String(reason).trim() : null,
    });

    if (error?.code === '23505') {
      return res.status(409).json({ message: 'Вы уже пожаловались на этот материал.' });
    }
    if (error) throw error;

    res.status(201).json({ message: 'Жалоба отправлена на проверку.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createReport };
