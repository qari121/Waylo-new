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
    bundleIdentifier: 'com.waylo.app',
    infoPlist: {
      NSCameraUsageDescription: 'This app needs access to your camera to take profile pictures.',
      NSPhotoLibraryUsageDescription: 'This app needs access to your photo library to select profile pictures.'
    }
  },
  android: {
    package: 'com.waylo.app',
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE'
    ]
  },
  plugins: [
    ['expo-router'],
    [
      'expo-image-picker',
      {
        photosPermission: 'This app needs access to your photo library to select profile pictures.',
        cameraPermission: 'This app needs access to your camera to take profile pictures.'
      }
    ]
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