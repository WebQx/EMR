import jwt from 'jsonwebtoken';

// This test is illustrative: it decodes a fabricated RS256-like payload to assert claim extraction logic shape.
// Real runtime verification is handled by services/shared/jwt_rs256.ts using JWKS.

describe('token claims shape', () => {
  it('includes role, specialties, email, name when present', () => {
    const samplePayload = {
      iss: 'webqx.healthcare',
      aud: 'webqx.emr',
      role: 'provider',
      specialties: ['cardiology','telehealth'],
      email: 'demo@webqx.health',
      name: 'Demo Provider',
      sub: '123',
      iat: Math.floor(Date.now()/1000),
      exp: Math.floor(Date.now()/1000)+3600
    };
    // Sign with temporary key (HS256 for unit isolated check) – we are not verifying RS256 cryptography here.
    const token = jwt.sign(samplePayload, 'testsecret', { algorithm: 'HS256' });
    const decoded = jwt.decode(token) as any;
    expect(decoded.role).toBe('provider');
    expect(decoded.specialties).toContain('cardiology');
    expect(decoded.email).toBe('demo@webqx.health');
    expect(decoded.name).toBe('Demo Provider');
  });
});
