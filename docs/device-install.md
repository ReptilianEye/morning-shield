# Installing Standalone Builds on Physical Devices (iOS & Android)

By default, development builds (`npm run ios` / `npm run android`) require the Metro/Expo dev server to be running on your computer. To test **MorningShield** anywhere on your physical phone without Metro, build and install a **Release** binary directly over USB—the JavaScript bundle and assets are compiled into the app itself.

---

## Prerequisites

1. Install dependencies from `morning-shield/`:
   ```bash
   npm install
   ```
2. If you recently changed plugins or native dependencies in `app.config.ts`, regenerate the native projects first:
   ```bash
   npx expo prebuild --clean
   ```

---

## iOS (Physical iPhone via USB)

### Prerequisites on Mac & iPhone
- **Xcode** installed on macOS with an Apple ID signed in (**Xcode → Settings → Accounts**).
- Connect your iPhone via USB, unlock it, and tap **Trust This Computer** when prompted.
- Enable **Developer Mode** on the iPhone if needed: **Settings → Privacy & Security → Developer Mode**.

### Option 1: CLI Release Build
Run from `morning-shield/`:

```bash
npx expo run:ios --configuration Release --device
```

Select your connected iPhone when prompted (or pass its name/UDID via `--device "<Device Name or UDID>"`).

### Option 2: Xcode GUI (Recommended for First-Time Signing)
1. Open the workspace in Xcode:
   ```bash
   open ios/MorningShield.xcworkspace
   ```
2. Select the **MorningShield** target → **Signing & Capabilities**, enable **Automatically manage signing**, and choose your **Team** (a free personal Apple ID works).
   - If you get a bundle identifier conflict, change `bundleIdentifier` in `app.config.ts` (and re-run `npx expo prebuild`) or update it in Xcode's **Signing & Capabilities**.
3. Select your connected physical iPhone from the top device menu.
4. Go to **Product → Scheme → Edit Scheme… → Run → Info** and change **Build Configuration** from `Debug` to **`Release`**.
5. Click **Run (`⌘R`)**.

### First Launch & Signing Notes on iPhone
- On first launch, iOS may block an untrusted personal developer certificate. On the iPhone, open **Settings → General → VPN & Device Management**, tap your Apple ID certificate, and tap **Trust**.
- **7-day limit (free Apple ID):** Apps signed with a free personal Apple ID expire after **7 days** and just need a quick re-run from Xcode/`run:ios` to renew. A paid Apple Developer account (\$99/year) extends signing to 1 year.
- Local notifications (`enableRemoteNotifications: false` in `app.config.ts`), camera, and motion sensors all work offline in this Release build.

---

## Android (Physical Phone via USB)

### Prerequisites on Phone & Computer
- Android SDK Platform Tools (`adb`) installed (via Android Studio or Homebrew `android-platform-tools`).
- On the Android phone:
  1. Enable **Developer Options** (**Settings → About phone → Tap Build number 7 times**).
  2. Enable **USB Debugging** inside **Settings → System → Developer options**.
  3. Connect via USB and accept the **Allow USB debugging** prompt.
  4. Verify your device appears:
     ```bash
     adb devices
     ```

### Option 1: CLI Release Build (Fastest)
Run from `morning-shield/`:

```bash
npx expo run:android --variant release --device
```

This compiles the standalone release APK (already configured in `android/app/build.gradle` to use `debug.keystore` for local device testing) and installs it directly onto your connected phone.

### Option 2: Build & Install a Standalone APK with Gradle
If you want an `.apk` file you can copy or install manually via `adb`:

```bash
cd android
./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

The standalone APK is generated at:
`android/app/build/outputs/apk/release/app-release.apk`

### Optional: Grant Overlay & Usage Stats Permissions (for Blocker Testing)
```bash
adb shell appops set com.dev.morningshield SYSTEM_ALERT_WINDOW allow
adb shell appops set com.dev.morningshield GET_USAGE_STATS allow
```

---

## Troubleshooting

- **App still asks for Metro server:** Make sure you built with `--configuration Release` (iOS) or `--variant release` / `assembleRelease` (Android), not `Debug`.
- **iOS signing fails on capability/entitlement:** Verify `enableRemoteNotifications: false` is set under `expo-notifications` in `app.config.ts` and re-run `npx expo prebuild --clean` if needed.
- **Switching back to development mode:** Run `npm run ios` or `npm run android` (which builds `Debug` and connects to Metro as usual).
