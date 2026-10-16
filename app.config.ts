import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'MorningShield',
  slug: 'morning-shield',
  version: '1.0.0',
  scheme: 'morningshield',
  orientation: 'portrait',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.dev.morningshield',
  },
  android: {
    package: 'com.dev.morningshield',
    permissions: [
      'SYSTEM_ALERT_WINDOW',
      'PACKAGE_USAGE_STATS',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
    ],
  },
  plugins: [
    'expo-router',
    'expo-splash-screen',
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
          compileSdkVersion: 36,
          targetSdkVersion: 36,
        },
        ios: {
          deploymentTarget: '16.4',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});