function sendError(res, code, message, extra = {}) {
  return res.status(code).json({ success: false, message, ...extra });
}

function sendValidationError(res, errors) {
  return res.status(400).json({ success: false, message: 'Validation failed', errors });
}

function sendSuccess(res, payload = {}, message = 'OK') {
  return res.json({ success: true, message, ...payload });
}

module.exports = { sendError, sendSuccess, sendValidationError };
