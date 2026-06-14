export function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect('/admin/login');
}

export function requireAdminJson(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

export function redirectIfAuthed(req, res, next) {
  if (req.session && req.session.admin) return res.redirect('/admin');
  return next();
}

export function requireClient(req, res, next) {
  if (req.session && req.session.client) return next();
  return res.redirect('/portal/login');
}
