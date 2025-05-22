const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // ---------- alias for our firebase shim --------------
  config.resolver ??= {};
  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    'firebase/auth/react-native': require.resolve('./firebase-auth-react-native.js'),
  };

  // ---------- (optional) extra polyfills ---------------
  if (config.serializer?.getPolyfills) {
    const defaultGetPolyfills = config.serializer.getPolyfills;
    config.serializer.getPolyfills = (...args) => [
      // comment out the next line if you removed the file
      require.resolve('./polyfill-promise.js'),
      ...defaultGetPolyfills(...args),
    ];
  }

  return config;
})();
