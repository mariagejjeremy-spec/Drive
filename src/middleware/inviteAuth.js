// src/middleware/inviteAuth.js
// Middleware to allow either an authenticated user (req.user) OR a valid invite password.
module.exports = function inviteAuth(req, res, next) {
  // If user is authenticated, proceed
  if (req.user && req.user.id) return next();

  // Otherwise check invite password
  const invitePassword = process.env.INVITE_PASSWORD;
  if (!invitePassword) {
    // no invite password configured -> block unauthenticated access
    return res.status(401).json({ error: 'Unauthorized: no invite password configured' });
  }

  // Accept password in header 'x-invite-password' or in body { password } or query param
  const provided = req.headers['x-invite-password'] || (req.body && req.body.password) || req.query.password;
  if (!provided) return res.status(401).json({ error: 'Unauthorized: invite password required' });

  if (provided === invitePassword) return next();

  return res.status(403).json({ error: 'Forbidden: invalid invite password' });
};
