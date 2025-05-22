// metro.config.js  (ROOT)
const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const defaultGetPolyfills = config.serializer.getPolyfills;

  // 🚑  pass *all* args through
  config.serializer.getPolyfills = (...args) => [
    require.resolve('./polyfill-promise.js'),   // ← your shim
    ...defaultGetPolyfills(...args),            // ← Expo’s originals
  ];

  return config;
})();
