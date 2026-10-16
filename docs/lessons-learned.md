# Lessons Learned

A log of technical gotchas, environment quirks, and architectural decisions encountered while building **MorningShield** on **Expo SDK 57 / React Native 0.86**.

---

## 1. Global `~/.npmrc` `min-release-age` Blocking Expo SDK 57 Packages
- **Symptom:** Running `npx expo install ...` failed with:
  `npm error notarget No matching version found for expo-notifications@~57.0.23 with a date before ...`
- **Root Cause:** Global `~/.npmrc` contained `min-release-age = 14`, which blocks installing npm packages published within the last 14 days. Because Expo SDK 57 patch releases (`~57.0.x`) were published recently, npm aborted before installing remaining dependencies (`@shopify/react-native-skia`, `react-native-mmkv`, `zustand`, `matter-js`).
- **Fix:** Pass `npm_config_min_release_age=0` when installing dependencies (`npm_config_min_release_age=0 npx expo install ...`).

---

## 2. `@shopify/react-native-skia` Prebuilt Binaries & `allow-scripts`
- **Symptom:** npm warned:
  `npm warn allow-scripts 1 package has install scripts not yet covered by allowScripts: @shopify/react-native-skia@2.6.2 (postinstall: node scripts/install-libs.js)`
- **Root Cause:** npm's script security setting prevented `@shopify/react-native-skia` from automatically running `scripts/install-libs.js`, which copies the `.xcframework` and Android static `.a` binaries from `react-native-skia-apple-*` and `react-native-skia-android` into `node_modules/@shopify/react-native-skia/libs/`.
- **Fix:** Explicitly run `node node_modules/@shopify/react-native-skia/scripts/install-libs.js` (or approve the script via `npm approve-scripts @shopify/react-native-skia`) before running `npx expo prebuild` or native builds.

---

## 3. Expo SDK 57 / React Native 0.86 `app.config.ts` Changes
- **`newArchEnabled` Removed from `ExpoConfig` Types:**
  In Expo SDK 57 (React Native 0.86), the New Architecture (Fabric + TurboModules) is permanently enabled and the `newArchEnabled` property was removed from `@expo/config-types`. Including `newArchEnabled: true` in `app.config.ts` causes `TS2353: 'newArchEnabled' does not exist in type 'ExpoConfig'`.
- **`ios.deploymentTarget` Minimum is `16.4`:**
  `expo-build-properties` in SDK 57 enforces a minimum iOS deployment target of `16.4`. Setting `'16.0'` throws `Error: ios.deploymentTarget needs to be at least version 16.4.` during config evaluation.
- **Android `compileSdkVersion` & `targetSdkVersion` Default to `36`:**
  React Native 0.86 and its AndroidX dependencies target SDK `36` (`libs.versions.toml` specifies `compileSdk = "36"`, `targetSdk = "36"`). Configured `expo-build-properties` accordingly while keeping `minSdkVersion: 26`.

---

## 4. `react-native-mmkv` v4 Requires `react-native-nitro-modules`
- **Context:** `npx expo install react-native-mmkv` installs `react-native-mmkv@^4.3.2`, which is built on Nitro Modules (`react-native-nitro-modules` is a required peer dependency).
- **Fix:** Installed `react-native-nitro-modules` alongside `react-native-mmkv`. Additionally, always wrap MMKV initialization with an in-memory fallback in `useMorningStore.ts` so web previews or test environments without JSI/Nitro never crash.

---

## 5. TypeScript CSS Module Declarations (`expo-env.d.ts`)
- **Symptom:** `npx tsc --noEmit` reported missing module declarations for `./animated-icon.module.css` and `@/global.css`.
- **Root Cause:** `expo-env.d.ts` (referenced in `tsconfig.json`) is generated on first `expo start` and wasn't created yet.
- **Fix:** Created `expo-env.d.ts` with `/// <reference types="expo/types" />` so `tsc --noEmit` passes cleanly in CI/terminal before starting the dev server.

---

## 6. Interactive CLI Prompts Hanging Automated Checks
- **Symptom:** Running `npx expo customize tsconfig.json`, first-time `npx expo lint` (before `eslint.config.js` exists), or `npx expo-doctor` (without `-y`) hangs waiting for interactive stdin confirmation.
- **Fix:**
  - Create `expo-env.d.ts` and `eslint.config.js` directly instead of triggering interactive setup wizards.
  - Always pass `-y` to `npx -y expo-doctor` so it never blocks on package installation prompts.

---

## 7. GitHub Actions `android-actions/setup-android@v3` Failing on `sdkmanager tools`
- **Symptom:** The `Android Debug APK Build` job failed during `Setup Android SDK` with:
  `Warning: Failed to find package 'tools'` / `Error: The process '/usr/local/lib/android/sdk/cmdline-tools/16.0/bin/sdkmanager' failed with exit code 1`.
- **Root Cause:** Google removed the obsolete `tools` package from the Android SDK repository, which `android-actions/setup-android@v3` attempts to install by default.
- **Fix:** Removed `android-actions/setup-android@v3`. GitHub's `ubuntu-latest` runner already pre-installs the Android SDK at `$ANDROID_HOME`; accepting licenses via `yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses` allows Gradle to auto-provision the exact SDK/NDK versions required by the build. Also upgraded `actions/checkout`, `actions/setup-node`, and `actions/setup-java` from `@v4` to `@v5` to eliminate Node 20 deprecation warnings.

---

## 8. Regenerating Expo Router Typed Routes (`.expo/types/router.d.ts`) Before `tsc`
- **Symptom:** Adding or removing route files in `src/app/` and running bare `tsc --noEmit` fails with `TS2322` when `.expo/types/router.d.ts` has stale route declarations (or on fresh CI checkouts where `expo-env.d.ts` and `.expo/types/` are gitignored).
- **Fix:** Use Expo's built-in `expo customize tsconfig.json && tsc --noEmit` in `npm run typecheck`, which automatically generates both `expo-env.d.ts` and `.expo/types/router.d.ts` before running TypeScript.

---

## 9. iOS 27 SDK `UIScene` Life Cycle Requirement (`_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`)
- **Symptom:** Running `npm run ios` builds the app, but UIKit aborts on launch with:
  `Application failed to launch: UIScene life cycle is required for apps built with this SDK.`
- **Root Cause:** Building with the iOS 27 SDK (Xcode 27+) enforces the UIKit `UIScene` life cycle at launch. While `expo@57.0.30` includes `ExpoAppSceneDelegate` (`@objc(EXExpoAppSceneDelegate)`) and `ExpoReactNativeFactoryProvider`, `expo-template-bare-minimum@57.0.32` still generates a legacy `AppDelegate.swift` without a `UIApplicationSceneManifest`.
- **Fix:** Configured `UIApplicationSceneManifest` (`UISceneDelegateClassName: 'EXExpoAppSceneDelegate'`) in `ios.infoPlist` and added a `withAppDelegate` config plugin (`withIosSceneLifecycle`) in `app.config.ts` so `AppDelegate` conforms to `ExpoReactNativeFactoryProvider` and delegates window creation to `EXExpoAppSceneDelegate`.

