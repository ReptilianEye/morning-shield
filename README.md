# 🛡️ MorningShield — Morning Anti-Doomscrolling App

**MorningShield** is a cross-platform mobile application built with **React Native (Expo SDK 57 Development Build, New Architecture)** designed to break the unconscious reflex of morning doomscrolling right after waking up.

Instead of passively dismissing an alarm and opening social media in bed, users complete short, engaging **physical-motor riddles** driven by smartphone hardware sensors (accelerometer/gyroscope & multi-point touch) during their configured morning wake-up window.

---

## ✨ Key Features & User Stories

1. **Conscious Wake-Up Riddles (Core Hardware Challenges)**
   - **🧊 Riddle 1: Break the AI Cat from Ice (`ice-cat`)** — Shake the phone ($> 2.2\text{g}$ total acceleration via `expo-sensors`) and tap weak-spot markers (`Gesture.Tap()`) to shatter a frosted `@shopify/react-native-skia` ice layer with procedural cracks and heavy haptic feedback.
   - **🌀 Riddle 2: Gyroscope / Tilt Maze (`gyro-maze`)** — Tilt the phone in 2D space to control `matter-js` world gravity at 60 FPS, guiding a ball through maze barriers to the goal sensor rendered on a Skia canvas.
2. **Morning Ritual Scheduling (Wake Window)**
   - Configure a daily morning window (e.g., `06:30–08:30`). During this window, MorningShield automatically locks into riddle mode until solved for the day (`YYYY-MM-DD`), persisted synchronously via `react-native-mmkv` + `zustand`.
3. **Distraction App Blocker (Android Optional Enhancement)**
   - Uses `SYSTEM_ALERT_WINDOW` and `PACKAGE_USAGE_STATS` on Android to detect launches of distracting apps (Instagram, TikTok, YouTube, etc.) during an active, unsolved morning window and bring the riddle screen to the foreground.
   - On iOS, runs in standalone morning-ritual mode (schedule, local notifications, hardware riddles) without requiring paid `FamilyControls` entitlements.

---

## 🧱 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework & Routing** | Expo SDK 57 (`~57.0.30`), React Native `0.86.3` (New Architecture), `expo-router` v57 (Typed Routes) |
| **Sensors & Feedback** | `expo-sensors` (`Accelerometer`), `expo-haptics` |
| **Graphics & Physics** | `@shopify/react-native-skia` (`2.6.2`), `matter-js` (`^0.20.0`) |
| **Animations & Gestures** | `react-native-reanimated` (`4.5.1`), `react-native-gesture-handler` (`~2.32.0`) |
| **State & Storage** | `zustand` (`^5.0.15`), `react-native-mmkv` (`^4.3.2`) + `react-native-nitro-modules` |
| **Notifications** | `expo-notifications` |

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── _layout.tsx             # Root Stack layout + GestureHandlerRootView + morning lock guard
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Dashboard & Settings tabs
│   │   ├── index.tsx           # Status screen (Locked/Unlocked, timer, test riddle triggers)
│   │   └── settings.tsx        # Wake-up window config & Android blocked apps selector
│   └── riddle/
│       ├── _layout.tsx         # Fullscreen modal layout (gestureEnabled: false, back button disabled)
│       ├── ice-cat.tsx         # Riddle 1: Break the AI Cat from Ice
│       └── gyro-maze.tsx       # Riddle 2: Gyroscope / Accelerometer Maze
├── components/
│   ├── IceOverlayCanvas.tsx    # Skia crack & frost rendering layer
│   └── MazeCanvas.tsx          # Skia renderer for Matter.js bodies
├── hooks/
│   ├── useShakeDetector.ts     # Accelerometer magnitude hook
│   └── useTiltGravity.ts       # Accelerometer X/Y tilt vector hook
├── services/
│   ├── appBlocker.android.ts   # Stub/Wrapper for Android UsageStats & Overlay
│   └── appBlocker.ios.ts       # No-op implementation for iOS
└── store/
    └── useMorningStore.ts      # Zustand + MMKV store
```

---

## 🚀 Getting Started

### 1. Install Dependencies & Native Prebuild
```bash
# Install JS & native dependencies
npm install

# Generate native android/ and ios/ directories
npx expo prebuild
```

### 2. Run Development Builds
```bash
# Run on Android Emulator / Device
npm run android

# Run on iOS Simulator / Device
npm run ios

# Start Metro bundler
npm start
```

### 3. Android ADB Permissions (For Overlay / Usage Stats Testing)
```bash
adb shell appops set com.dev.morningshield SYSTEM_ALERT_WINDOW allow
adb shell appops set com.dev.morningshield GET_USAGE_STATS allow
```

---

## 🧪 Linting, Typechecking & CI (GitHub Actions + GitHub CLI)

### Local Quality Checks
```bash
npm run check       # Runs both TypeScript (tsc --noEmit) and ESLint (expo lint)
npm run typecheck   # npx tsc --noEmit
npm run lint        # npx expo lint
npm run doctor      # npx -y expo-doctor
```

### GitHub Actions CI Pipeline (`.github/workflows/ci.yml`)
Our CI workflow runs two fast verification jobs:
1. **`quality` (Fast Gate):** Validates `app.config.ts`, runs `npm run typecheck` (`expo customize tsconfig.json && tsc --noEmit`), `npm run lint` (`expo lint`), and `npm run doctor` (`expo-doctor`).
2. **`bundle-and-prebuild`:** Verifies Continuous Native Generation (`npx expo prebuild --no-install --clean`) and exports production Metro JS bundles (`npx expo export`) for both Android and iOS.

### GitHub CLI (`gh`) Commands
Use the GitHub CLI to trigger and monitor CI runs directly from the terminal:

```bash
# Trigger the CI workflow manually on the current branch
gh workflow run ci.yml

# List recent CI runs and watch live progress
gh run list --workflow=ci.yml
gh run watch

# View logs for any failed steps in the latest run
gh run view --log-failed
```

---

## 📚 Documentation

Detailed project documentation is maintained in the [`docs/`](./docs/README.md) directory:
- **[Setup & Agent Skills](./docs/setup-and-skills.md)** — Curated Expo & Callstack React Native agent skills and environment setup.
- **[Features & Architecture](./docs/features.md)** — Detailed specifications and implementation checklist.
- **[Lessons Learned](./docs/lessons-learned.md)** — Expo SDK 57 / React Native 0.86 troubleshooting notes and architectural lessons.
