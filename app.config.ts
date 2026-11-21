import { ConfigContext, ExpoConfig } from 'expo/config';
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
    'expo-image',
    'expo-status-bar',
    [
      'expo-camera',
      {
        cameraPermission:
          'Allow $(PRODUCT_NAME) to access your camera for color matching challenges.',
        microphonePermission: false,
        recordAudioAndroid: false,
        barcodeScannerEnabled: false,
      },
    ],
    [
      'expo-sensors',
      {
        motionPermission:
          'Allow $(PRODUCT_NAME) to access device motion for shake and tilt challenges.',
      },
    ],
    [
      'expo-notifications',
      {
        enableRemoteNotifications: false,
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
          compileSdkVersion: 37,
          targetSdkVersion: 37,
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