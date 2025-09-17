module.exports = function Keycloak() {
  return {
    init: jest.fn().mockResolvedValue(true),
    login: jest.fn(),
    logout: jest.fn(),
    updateToken: jest.fn().mockResolvedValue(true),
    token: 'mock-token',
    tokenParsed: { preferred_username: 'test-user', email: 'test@webqx.health', realm_access: { roles: ['provider','patient'] } }
  };
};