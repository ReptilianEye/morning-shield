import { ExpoConfig, ConfigContext } from 'expo/config';
import { withAppDelegate, ConfigPlugin } from 'expo/config-plugins';

/**
 * Adopts the UIKit UIScene life cycle required by the iOS 27 SDK (Xcode 27+)
 * using Expo SDK 57's built-in `EXExpoAppSceneDelegate` and `ExpoReactNativeFactoryProvider`.
 */
const withIosSceneLifecycle: ConfigPlugin = (config) =>
  withAppDelegate(config, (mod) => {
    let contents = mod.modResults.contents;

    if (!contents.includes('ExpoReactNativeFactoryProvider')) {
      contents = contents.replace(
        'class AppDelegate: ExpoAppDelegate {',
        'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'
      );
    }

    // Remove legacy window creation in didFinishLaunchingWithOptions;
    // EXExpoAppSceneDelegate creates the UIWindow from UIWindowScene and starts React Native.
    contents = contents.replace(
      /#if os\(iOS\) \|\| os\(tvOS\)\s+window = UIWindow\(frame: UIScreen\.main\.bounds\)\s+factory\.startReactNative\(\s+withModuleName: "main",\s+in: window,\s+launchOptions: launchOptions\)\s+#endif\n?/m,
      '    // Window creation and startReactNative are handled by EXExpoAppSceneDelegate\n'
    );

    mod.modResults.contents = contents;
    return mod;
  });

export default ({ config }: ConfigContext): ExpoConfig =>
  withIosSceneLifecycle({
    ...config,
    name: 'MorningShield',
    slug: 'morning-shield',
    version: '1.0.0',
    scheme: 'morningshield',
    orientation: 'portrait',
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.dev.morningshield',
      infoPlist: {
        UIApplicationSceneManifest: {
          UIApplicationSupportsMultipleScenes: false,
          UISceneConfigurations: {
            UIWindowSceneSessionRoleApplication: [
              {
                UISceneConfigurationName: 'Default Configuration',
                UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
              },
            ],
          },
        },
      },
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