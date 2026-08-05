// Пропускает дальше только администраторов. Ставится после authMiddleware.
function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ разрешён только администраторам' });
  }
  next();
}

module.exports = { adminMiddleware };
