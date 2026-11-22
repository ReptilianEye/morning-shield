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

### Testing Notifications on Your Physical iPhone
MorningShield schedules **on-device local daily reminders** via `UNUserNotificationCenter` (`expo-notifications`), so notifications work on a physical iPhone even with a free Personal Apple ID (remote APNs pushes are intentionally disabled via `enableRemoteNotifications: false` so Personal Team signing works without a paid Apple Developer membership):
1. Connect your unlocked iPhone via USB (with **Developer Mode** turned on) and run a Release or Development build (`npx expo run:ios --configuration Release --device`).
2. Open **MorningShield → Settings**, toggle **Wake-Up Reminders** OFF → ON to trigger the system notification permission prompt, and tap **Allow** (Settings only requests permission interactively on toggle, not silently at app launch).
3. If you already solved a challenge earlier today, tap **Reset Today's Completion** in Settings (deep-linking on notification tap only launches a challenge when today isn't solved yet).
4. Temporarily set **Starts at** to 1–2 minutes from now using the minute-by-minute time picker, tap **Done**, and background or lock the iPhone — the local notification banner fires at that minute, and tapping it opens the active challenge directly.

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
