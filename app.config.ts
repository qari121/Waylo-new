import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Waylo',
  slug: 'waylo',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.waylo.app'
  },
  android: {
    package: 'com.waylo.app'
  },
  plugins: [
    ['expo-router']
  ],
  extra: {
    router: {
      origin: false,
      tsconfigPaths: true,
      typedRoutes: true
    },
    eas: {
      projectId: 'your-project-id'
    }
  }
}); 