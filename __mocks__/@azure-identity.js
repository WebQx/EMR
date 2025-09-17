module.exports = {
  ClientSecretCredential: function() {
    return { getToken: async () => ({ token: 'azure-mock-token', expiresOnTimestamp: Date.now() + 3600000 }) };
  }
};