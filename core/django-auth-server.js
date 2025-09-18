/**
 * Minimal Django Auth Server Stub (Node.js placeholder)
 * This replaces the missing Django auth service for local unified startup.
 * Provides basic /health endpoint and a mock /api/auth/login route.
 * Replace with real Django integration or proxy when available.
 */

const express = require('express');
const helmet = require('helmet');

const app = express();
app.use(express.json());
app.use(helmet({ crossOriginEmbedderPolicy: false }));

const PORT = process.env.DJANGO_PORT || process.env.PORT || 3001;

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'django-auth-stub', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  const { username = 'demo', password } = req.body || {};
  // Always succeed for stub
  res.json({
    success: true,
    token: 'stub-token-' + Math.random().toString(36).slice(2),
    user: { id: 'stub-user', username, roles: ['demo'], loginAt: new Date().toISOString() }
  });
});

const server = app.listen(PORT, () => {
  console.log(`🔐 Django Auth Stub listening on ${PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
