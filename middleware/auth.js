// Placeholder JWT auth middleware (to be replaced with real validation)
const jwt = require('jsonwebtoken');

module.exports = function authOptional(req, _res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      // In production replace secret & add algorithms
      const decoded = jwt.decode(token) || {}; // decode only (no verify) for placeholder
      req.user = decoded;
    } catch (e) {
      // ignore decode error
    }
  }
  next();
};
