# Features & Architecture

This document tracks the core features of **MorningShield**, their technical design, and implementation status.

## Implementation Status

- [x] **Task 1: Bootstrap & Config** — Dependencies installed, `app.config.ts` configured for Expo SDK 58 (including `expo-camera`, `expo-sensors`, `expo-notifications`, and `expo-build-properties`), TypeScript, ESLint, and GitHub Actions CI configured.
- [x] **Task 1.5: Navigation & Initial Screens (`feat/navigation-placeholders`)** — Landing screen (`/`), modal Settings dialog (`/settings`), and fullscreen Riddle routes (`/riddle/ice-cat`, `/riddle/gyro-maze`, `/riddle/color-match`).
- [x] **Task 2: State Management (`src/store/useMorningStore.ts`)** — Zustand + `react-native-mmkv` store with safe in-memory fallback.
- [x] **Task 3: Riddle 1 — Ice Cat (`src/app/riddle/ice-cat.tsx`)** — Accelerometer shake detector (`> 2.2g`), `Gesture.Tap()` pulsing weak spots, Skia `IceCatIllustration`, and `IceOverlayCanvas` procedural cracks/frost.
- [x] **Task 3.5: Riddle 3 — Color Match (`src/app/riddle/color-match.tsx`)** — Complementary random color picker, live camera sampling (`ColorMatchCamera`), HSL similarity matching (`>= 80%`), and confetti celebration.
- [ ] **Task 4: Riddle 2 — Gyro Maze (`src/app/riddle/gyro-maze.tsx`)** — `matter-js` 2D physics world driven by `useTiltGravity` at 60 FPS, rendered on Skia canvas ([#3](https://github.com/ReptilianEye/morning-shield/issues/3)).
- [x] **Task 5: Navigation Guard, Settings, Notifications & Dashboard** — Automatic redirect when `isMorningLocked()` is active (`src/app/_layout.tsx`), Android back-button blocker (`src/app/riddle/_layout.tsx`), interactive Settings modal with custom minute-precision `TimePickerModal` (`src/app/settings.tsx`), daily wake-up notification scheduling (`src/utils/notifications.ts`), and updated Home dashboard (`src/app/index.tsx`).
- [ ] **Task 6: Android App Blocker & Follow-up Enhancements** — Android `UsageStats` / overlay launcher interception, notification tap deep-linking ([#10](https://github.com/ReptilianEye/morning-shield/issues/10)), and Sequence Tap riddle ([#9](https://github.com/ReptilianEye/morning-shield/issues/9)).

---

## Feature Specifications

### 1. Morning Lock State & Persistence (`src/store/useMorningStore.ts`)
- **Storage:** `react-native-mmkv` (`createMMKV`) with an automatic in-memory `Map` fallback if JSI/Nitro is unavailable.
- **State Fields:**
  - `shieldEnabled`: `boolean` (default `true`)
  - `wakeWindow`: `{ startHour: number; startMinute: number; endHour: number; endMinute: number }` (default `06:30`–`08:30`)
  - `lastSolvedDate`: `string | null` (`YYYY-MM-DD` local date)
  - `selectedRiddle`: `'ice-cat' | 'gyro-maze' | 'color-match' | 'random'` (default `'random'`)
  - `notificationsEnabled`: `boolean` (default `true`)
  - `blockedApps`: `string[]` (selected app IDs mapped to Android package names)
- **Computed / Actions:**
  - `isMorningLocked()`: Returns `true` if `shieldEnabled` is enabled, current local time is within `wakeWindow`, and `lastSolvedDate !== today`.
  - `markRiddleSolved()`: Sets `lastSolvedDate` to today's `YYYY-MM-DD` and unlocks the morning state.

### 2. Riddle 1: Break the Ice Cat (`src/app/riddle/ice-cat.tsx`)
- **Sensors & Input:**
  - `useShakeDetector`: Listens to `Accelerometer` (80ms interval); triggers when $\sqrt{x^2 + y^2 + z^2} > 2.2\text{g}$.
  - `Gesture.Tap()` (`react-native-gesture-handler` v2): Tapping pulsing weak-spot markers or chipping anywhere on the ice block.
- **Visuals & Feedback:**
  - `IceCatIllustration` (`@shopify/react-native-skia`): Vector cat whose expression and palette shift across frozen, thawing, and freed states.
  - `IceOverlayCanvas` (`@shopify/react-native-skia`): Renders frost opacity tied to `iceHealth` (`100 -> 0`), diagonal ice sheen, and procedural jagged crack paths radiating from impact points.
  - `expo-haptics`: Heavy impact feedback on shakes/weak-spot hits, medium impact on chips, success notification on shatter.

### 3. Riddle 2: Gyroscope / Accelerometer Maze (`src/app/riddle/gyro-maze.tsx`) — *Pending ([#3](https://github.com/ReptilianEye/morning-shield/issues/3))*
- **Physics & Input:**
  - `useTiltGravity`: Maps `Accelerometer` $(x, y)$ at 16ms (~60 FPS) to `engine.world.gravity`.
  - `matter-js`: Rigid-body simulation with outer walls, internal maze barriers, player ball (top-left), and goal sensor (bottom-right).
- **Visuals & Feedback:**
  - `MazeCanvas` (`@shopify/react-native-skia`): Renders maze walls, goal zone, and ball position at 60 FPS.
  - Triggers light haptic feedback on wall collisions and solves the riddle when the ball enters the goal sensor.

### 4. Riddle 3: Color Match (`src/app/riddle/color-match.tsx`)
- **Camera & Matching:**
  - Generates two complementary HSL target shades (`useColorCalculations`) and prompts the user to pick one.
  - Samples center-reticle pixels via `expo-camera` (`ColorMatchCamera`) and scores HSL similarity (`>= 80%` completes the challenge, triggers confetti, and marks today solved).

### 5. Navigation Guard, Dashboard, Notifications & Settings
- **Root Guard (`src/app/_layout.tsx` & `src/app/riddle/_layout.tsx`):** Wraps app in `GestureHandlerRootView`, checks `isMorningLocked()` on launch, foreground resume, and 15s ticks, redirects from `/` to `resolveActiveRiddleRoute(selectedRiddle)`, shows a `Locked` indicator instead of `< Back`, and blocks Android hardware back navigation inside `/riddle/*`.
- **Notifications (`src/utils/notifications.ts`):** Configures foreground notification behavior and schedules/cancels the repeating daily wake-up reminder at `wakeWindow.startHour : startMinute`.
- **Dashboard (`src/app/index.tsx`):** Displays current lock status, active wake window, preferred challenge badge, and direct entry to all challenges.
- **Settings (`src/app/settings.tsx` & `src/components/TimePickerModal.tsx`):** Toggle morning shield, adjust start/end times via `±15m` steppers, presets, or exact minute-by-minute picker, choose preferred challenge mode, toggle wake-up reminders, and select guarded apps.
