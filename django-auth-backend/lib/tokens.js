const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'webqx-django-style-jwt-secret-2024';

function generateAccessToken(user, remember) {
  return jwt.sign(
    { user_id: user.id, email: user.email, user_type: user.user_type },
    JWT_SECRET,
    { expiresIn: remember ? '7d' : '1h' }
  );
}

function generateRefreshToken(user, long = false) {
  return jwt.sign(
    { user_id: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: long ? '30d' : '7d' }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };
