const validator = require('validator');

/**
 * Validate registration payload returning errors object (Django-style) and sanitized data
 * Pure function: no side effects besides reading users Map.
 * @param {Object} data incoming registration body
 * @param {Map} users map keyed by email or id
 * @returns {{errors: Object, sanitized: Object}}
 */
function validateRegistration(data, users) {
  const errors = {};
  if (!data) return { errors: { non_field_errors: ['No data provided'] }, sanitized: {} };
  const {
    email, password, password_confirm,
    first_name, last_name, middle_name,
    date_of_birth, phone_number, user_type,
    country, language, terms_accepted,
    privacy_policy_accepted, hipaa_authorization,
    gdpr_consent
  } = data;

  if (!email || !validator.isEmail(email)) {
    errors.email = ['Enter a valid email address'];
  } else if (users.has(email.toLowerCase())) {
    errors.email = ['A user with this email already exists'];
  }

  if (!password || password.length < 12) {
    errors.password = ['Password must be at least 12 characters long'];
  }

  if (password !== password_confirm) {
    errors.password_confirm = ['Password confirmation does not match'];
  }

  if (!first_name) {
    errors.first_name = ['This field is required'];
  }

  if (!last_name) {
    errors.last_name = ['This field is required'];
  }

  if (!terms_accepted) {
    errors.terms_accepted = ['You must accept the terms and conditions'];
  }

  if (!privacy_policy_accepted) {
    errors.privacy_policy_accepted = ['You must accept the privacy policy'];
  }

  if ((user_type || 'PATIENT') === 'PATIENT' && !hipaa_authorization) {
    errors.hipaa_authorization = ['HIPAA authorization is required for patients'];
  }

  const sanitized = {
    email: (email || '').toLowerCase(),
    password,
    password_confirm,
    first_name: first_name || '',
    last_name: last_name || '',
    middle_name: middle_name || '',
    date_of_birth: date_of_birth || null,
    phone_number: phone_number || null,
    user_type: user_type || 'PATIENT',
    country: country || null,
    language: language || 'en',
    terms_accepted: !!terms_accepted,
    privacy_policy_accepted: !!privacy_policy_accepted,
    hipaa_authorization: !!hipaa_authorization,
    gdpr_consent: !!gdpr_consent
  };

  return { errors, sanitized };
}

module.exports = { validateRegistration };
