const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken } = require('./tokens');

function checkCredentialsInput(body) {
  if (!body || !body.email || !body.password) {
    return { valid: false, error: 'Email and password are required' };
  }
  return { valid: true };
}

function findUser(users, email) {
  return users.get(email.toLowerCase());
}

function checkAccountStatus(user) {
  if (!user) return { ok: false, code: 401, error: 'Invalid email or password' };
  if (!user.is_active) return { ok: false, code: 401, error: 'This account has been deactivated' };
  if (user.is_locked_out()) return { ok: false, code: 423, error: 'Account is temporarily locked due to multiple failed login attempts' };
  return { ok: true };
}

async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password_hash);
}

function buildLoginResponse(user, remember) {
  const access = generateAccessToken(user, remember);
  const refresh = generateRefreshToken(user, true);
  return {
    access,
    refresh,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.get_full_name(),
      user_type: user.user_type,
      role_info: user.get_role_info(),
      mfa_enabled: user.mfa_enabled,
      permissions: user.get_permissions()
    }
  };
}

module.exports = { checkCredentialsInput, findUser, checkAccountStatus, verifyPassword, buildLoginResponse };
