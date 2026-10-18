# 🛡️ MorningShield — Morning Anti-Doomscrolling App

**MorningShield** is a cross-platform mobile application built with **React Native (Expo SDK 58 Development Build, New Architecture)** designed to break the unconscious reflex of morning doomscrolling right after waking up.

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
| **Framework & Routing** | Expo SDK 58 (`~58.0.12`), React Native `0.88.0` (New Architecture), `expo-router` v58 (Typed Routes) |
| **Sensors & Feedback** | `expo-sensors` (`Accelerometer`), `expo-haptics` |
| **Graphics & Physics** | `@shopify/react-native-skia` (`2.14.0`), `matter-js` (`^0.20.0`) |
| **Animations & Gestures** | `react-native-reanimated` (`4.7.1`), `react-native-gesture-handler` (`~3.3.0`) |
| **State & Storage** | `zustand` (`^5.0.15`), `react-native-mmkv` (`^4.3.2`) + `react-native-nitro-modules` |
| **Notifications & Agent DevTools** | `expo-notifications`, `@swmansion/argent` (`^0.29.0`) |

---

## 📂 Project Structure

```text
src/
├── app/
│   ├── _layout.tsx             # Root Stack layout + GestureHandlerRootView + morning lock guard
│   ├── index.tsx               # Status screen (Locked/Unlocked, timer, test riddle triggers)
│   ├── settings.tsx            # Wake-up window config & Android blocked apps selector (modal)
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
npm run typecheck   # expo customize tsconfig.json && tsc --noEmit
npm run lint        # expo lint
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

## 📅 Weekly Progress Updates (2026)

| Week | Date Range (Start – End) | Status | Progress Summary |
| :--- | :--- | :--- | :--- |
| **Week 1** | `2026-10-12` – `2026-10-18` | ✅ Completed | Project bootstrap, Expo SDK 58 & New Architecture upgrade (`UIScene` lifecycle support), GitHub Actions CI pipeline (`quality` + `bundle-and-prebuild`), `@swmansion/argent` MCP setup, initial Expo Router navigation & placeholder screens ([PR #2](https://github.com/ReptilianEye/morning-shield/pull/2)), and backlog issues ([#1](https://github.com/ReptilianEye/morning-shield/issues/1), [#3](https://github.com/ReptilianEye/morning-shield/issues/3), [#4](https://github.com/ReptilianEye/morning-shield/issues/4), [#5](https://github.com/ReptilianEye/morning-shield/issues/5)). |
| **Week 2** | `2026-10-19` – `2026-10-25` | ⏳ Upcoming | _Update slot — add weekly progress notes here._ |
| **Week 3** | `2026-10-26` – `2026-11-01` | ⏳ Upcoming | _Update slot — add weekly progress notes here._ |
| **Week 4** | `2026-11-02` – `2026-11-08` | ⏳ Upcoming | _Update slot — add weekly progress notes here._ |
| **Week 5** | `2026-11-09` – `2026-11-15` | ⏳ Upcoming | _Update slot — add weekly progress notes here._ |
| **Week 6** | `2026-11-16` – `2026-11-22` | ⏳ Upcoming | _Update slot — add weekly progress notes here._ |
| **Week 7** | `2026-11-23` – `2026-11-29` | ⏳ Upcoming | _Update slot — add weekly progress notes here._ |
| **Week 8** | `2026-11-30` – `2026-12-06` | ⏳ Upcoming | _Update slot — add weekly progress notes here._ |
| **Week 9** | `2026-12-07` – `2026-12-13` | ⏳ Upcoming | _Update slot — add weekly progress notes here._ |
| **Week 10** | `2026-12-14` – `2026-12-20` | ⏳ Upcoming | _Update slot — add weekly progress notes here._ |
| **Week 11** | `2026-12-21` – `2026-12-27` | ⏳ Upcoming | _Update slot — add weekly progress notes here._ |
| **Week 12** | `2026-12-28` – `2026-12-31` | ⏳ Upcoming | _Update slot — add weekly progress notes here._ |

---

## 📚 Documentation

Detailed project documentation is maintained in the [`docs/`](./docs/README.md) directory:
- **[Setup & Agent Skills](./docs/setup-and-skills.md)** — Curated Expo, Callstack & Argent React Native agent skills and environment setup.
- **[Features & Architecture](./docs/features.md)** — Detailed specifications and implementation checklist.
- **[Lessons Learned](./docs/lessons-learned.md)** — Expo SDK 58 / React Native 0.88 troubleshooting notes and architectural lessons.
