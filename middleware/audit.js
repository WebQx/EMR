// Very lightweight append-only audit log (stdout + in-memory)
const events = [];

module.exports = function auditMiddleware(req, res, next) {
  const start = Date.now();
  const user = (req.user && req.user.sub) || 'anonymous';
  res.on('finish', () => {
    const record = {
      ts: new Date().toISOString(),
      ip: req.ip,
      m: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - start,
      user
    };
    events.push(record);
    if (events.length > 5000) events.shift();
    if (process.env.AUDIT_VERBOSE === 'true') {
      console.log('[AUDIT]', JSON.stringify(record));
    }
  });
  req.app.locals.__audit = events;
  next();
};

module.exports.auditEndpoint = function(req, res) {
  res.json({ count: (req.app.locals.__audit||[]).length, recent: (req.app.locals.__audit||[]).slice(-50) });
};
