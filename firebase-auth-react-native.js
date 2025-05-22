export * from 'firebase/auth';
export const getReactNativePersistence = (storage) => ({
  type: 'LOCAL',
  async _isAvailable() { return true; },
  async _set(key, value) { await storage.setItem(key, value); },
  async _get(key)        { return storage.getItem(key); },
  async _remove(key)     { await storage.removeItem(key); },
});
