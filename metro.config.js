const { getDefaultConfig } = require('@expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const config = getDefaultConfig(__dirname);

// Fix for Firebase/Expo Go error:
config.resolver.unstable_enablePackageExports = false;


// Remove 'svg' from assetExts
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
// Add 'svg' to sourceExts
config.resolver.sourceExts.push('svg');
// Set the svg transformer
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');




module.exports = withNativeWind(config, { input: './global.css' });
