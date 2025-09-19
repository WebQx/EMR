// Simple in-memory metrics collector
const hist = {};

module.exports = function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durMs = Number(process.hrtime.bigint() - start) / 1e6;
    const key = `${req.method} ${req.route ? req.route.path : req.path}`;
    if (!hist[key]) hist[key] = { count: 0, total: 0, p95Window: [] };
    const h = hist[key];
    h.count++; h.total += durMs; h.p95Window.push(durMs);
    if (h.p95Window.length > 200) h.p95Window.shift();
  });
  req.app.locals.__metrics = hist;
  next();
};

module.exports.metricsEndpoint = function metricsEndpoint(req, res) {
  const data = {};
  Object.entries(req.app.locals.__metrics || {}).forEach(([k, v]) => {
    const count = v?.count || 0;
    const total = v?.total || 0;
    const win = Array.isArray(v?.p95Window) ? v.p95Window : [];
    const sorted = [...win].sort((a,b)=>a-b);
    let p95 = 0;
    if (sorted.length > 0) {
      const idx = Math.max(0, Math.floor(sorted.length * 0.95) - 1);
      p95 = sorted[idx] || 0;
    }
    const avg = count > 0 ? +(total / count).toFixed(2) : 0;
    data[k] = { count, avg, p95: +p95.toFixed(2) };
  });
  res.json({ collected: Object.keys(data).length, metrics: data });
};
