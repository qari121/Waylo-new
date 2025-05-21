const { withPlugins } = require('@expo/config-plugins');

const withCustomConfig = (config) => {
  // Remove Google Maps configuration
  if (config.ios?.config?.googleMapsApiKey) {
    delete config.ios.config.googleMapsApiKey;
  }
  if (config.android?.config?.googleMaps?.apiKey) {
    delete config.android.config.googleMaps.apiKey;
  }

  return config;
};

module.exports = (config) => {
  return withPlugins(config, [
    withCustomConfig
  ]);
}; 