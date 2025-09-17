// Manual Jest mock for jwks-rsa to avoid ESM import issues in tests

const mockFactory = () => ({
  getSigningKey: jest.fn().mockResolvedValue({
    getPublicKey: () => 'mock-public-key'
  })
});

const jwksRsa = jest.fn().mockImplementation(mockFactory);

module.exports = jwksRsa;
