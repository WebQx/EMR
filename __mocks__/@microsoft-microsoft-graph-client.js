module.exports = {
  Client: {
    init: () => ({ api: () => ({ get: async () => ({ value: [] }) }) })
  }
};