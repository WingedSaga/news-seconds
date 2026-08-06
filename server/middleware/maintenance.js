const { getSetting } = require('../services/settings');

// В режиме обслуживания публичное чтение и запись закрыты, но админ-панель
// и авторизация продолжают работать — иначе режим невозможно выключить.
async function maintenanceGuard(req, res, next) {
  try {
    if (!(await getSetting('maintenance_mode'))) return next();

    if (req.user && req.user.role === 'admin') return next();

    return res.status(503).json({
      code: 'MAINTENANCE',
      message: 'Сайт на техническом обслуживании. Зайдите чуть позже.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { maintenanceGuard };
