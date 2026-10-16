# Setup & Agent Skills Guide

## 1. Pulling Official React Native & Expo Agent Skills

To equip AI coding agents with only the skills relevant to **MorningShield** (avoiding unrelated EAS cloud, brownfield migration, TV, or App Clip skills), run from `morning-shield/`:

```bash
cd /Users/rzadkows/coding/studies/mobile-systems/morning-shield

# 1. Pull only the 9 relevant Expo skills
npm_config_min_release_age=0 npx -y skills add expo/skills \
  --skill expo-overview \
  --skill expo-project-structure \
  --skill expo-router \
  --skill expo-dev-client \
  --skill expo-animation \
  --skill expo-native-ui \
  --skill expo-ui \
  --skill expo-design-system \
  --skill expo-module \
  -y

# 2. Pull only Callstack's React Native best-practices skill
npm_config_min_release_age=0 npx -y skills add callstackincubator/agent-skills \
  --skill react-native-best-practices \
  -y
```

### Curated Skills Kept in `.agents/skills/` & `.claude/skills/`
1. `expo-overview` — Core Expo SDK 57 fundamentals
2. `expo-project-structure` — File/folder organization conventions
3. `expo-router` — File-based routing, layouts, modal guards (`src/app/`)
4. `expo-dev-client` — Local Development Builds (`npx expo prebuild`, `run:android`, `run:ios`)
5. `expo-animation` — Reanimated & gesture-driven animations
6. `expo-native-ui` — Native UI patterns & system integration
7. `expo-ui` — `@expo/ui` components
8. `expo-design-system` — Styling and layout patterns
9. `expo-module` — Expo Modules API (for Android `SYSTEM_ALERT_WINDOW` / `PACKAGE_USAGE_STATS` bridging if needed)
10. `react-native-best-practices` — Callstack's performance, New Architecture, and Reanimated guidelines

*(Removed 26 out-of-scope skills: `eas-*`, `expo-app-clip`, `expo-brownfield`, `expo-data-fetching`, `expo-dom`, `expo-examples`, `expo-migrate-module`, `expo-skill-*`, `expo-upgrade`, `expo-web-to-native`, `assess-react-native-migration`, `create-react-native-library`, `github-actions`, `react-native-brownfield-migration`, `react-native-tv-best-practices`, `react-navigation`, `upgrading-react-native`, `validate-skills`, `writing-user-docs`.)*

---

## 2. Installed Libraries

### Core & Native Build Config
- `expo` (`~57.0.26`), `expo-router` (`~57.0.24`), `react` (`19.2.3`), `react-native` (`0.86.3`)
- `expo-build-properties` (`~57.0.22`)

### Hardware Sensors & Haptics
- `expo-sensors` (`~57.0.3`) — `Accelerometer` for shake magnitude and 2D tilt gravity vector
- `expo-haptics` (`~57.0.3`) — Tactile feedback on ice cracks and wall collisions

### Physics, Graphics & Animations
- `matter-js` (`^0.20.0`) + `@types/matter-js` — 2D rigid-body physics engine for the gyroscope maze
- `@shopify/react-native-skia` (`2.6.2`) — 2D GPU canvas for ice cracks, frost overlay, and maze rendering
- `react-native-reanimated` (`4.5.1`) & `react-native-worklets` (`0.10.1`) — 60/120 FPS UI-thread animations
- `react-native-gesture-handler` (`~2.32.0`) — `Gesture.Tap()` and `GestureDetector` v2 API

### State, Persistence & Notifications
- `zustand` (`^5.0.15`) — Global state store
- `react-native-mmkv` (`^4.3.2`) + `react-native-nitro-modules` (`^0.35.9`) — Fast synchronous JSI/Nitro storage
- `expo-notifications` (`~57.0.23`) — Local morning wake-up notifications

---

## 3. Verification & Native Prebuild Commands

```bash
# Typecheck
npx tsc --noEmit

# Lint
npx expo lint

# Validate public Expo config
npx expo config --type public

# Regenerate native android/ and ios/ directories after config/plugin changes
npx expo prebuild --clean

# Run development build
npx expo run:android
npx expo run:ios
```

---

## 4. Android Emulator Testing (ADB Permissions)

```bash
# Grant overlay permission (draw over other apps)
adb shell appops set com.dev.morningshield SYSTEM_ALERT_WINDOW allow

# Grant foreground app usage detection permission
adb shell appops set com.dev.morningshield GET_USAGE_STATS allow
```

