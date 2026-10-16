# Features & Architecture

This document tracks the core features of **MorningShield**, their technical design, and implementation status.

## Implementation Status

- [x] **Task 1: Bootstrap & Config** — Dependencies installed, `app.config.ts` validated for Expo SDK 57, TypeScript & ESLint configured.
- [ ] **Task 2: State Management (`src/store/useMorningStore.ts`)** — Zustand + MMKV store with safe in-memory fallback.
- [ ] **Task 3: Riddle 1 — Ice Cat (`src/app/riddle/ice-cat.tsx`)** — Accelerometer shake detector (`> 2.2g`) + `Gesture.Tap()` weak spots + Skia procedural crack/frost overlay.
- [ ] **Task 4: Riddle 2 — Gyro Maze (`src/app/riddle/gyro-maze.tsx`)** — `matter-js` 2D physics world driven by `useTiltGravity` at 60 FPS, rendered on Skia canvas.
- [ ] **Task 5: Navigation Guard & Dashboard (`src/app/_layout.tsx` & `src/app/(tabs)/`)** — Automatic redirect when `isMorningLocked()` is active, Android back-button blocker, wake-window settings, and on-demand riddle test buttons.

---

## Feature Specifications

### 1. Morning Lock State & Persistence (`src/store/useMorningStore.ts`)
- **Storage:** `react-native-mmkv` with an automatic in-memory Map fallback if JSI/Nitro is unavailable.
- **State Fields:**
  - `wakeWindow`: `{ startHour: number; startMinute: number; endHour: number; endMinute: number }` (default `06:30`–`08:30`)
  - `lastSolvedDate`: `string | null` (`YYYY-MM-DD` local date)
  - `selectedRiddle`: `'ice-cat' | 'gyro-maze' | 'random'`
  - `blockedApps`: `string[]` (Android package names)
- **Computed / Actions:**
  - `isMorningLocked()`: Returns `true` if current local time is within `wakeWindow` and `lastSolvedDate !== today`.
  - `markRiddleSolved()`: Sets `lastSolvedDate` to today's `YYYY-MM-DD` and unlocks the morning state.

### 2. Riddle 1: Break the AI Cat from Ice (`src/app/riddle/ice-cat.tsx`)
- **Sensors & Input:**
  - `useShakeDetector`: Listens to `Accelerometer` (80ms interval); triggers when $\sqrt{x^2 + y^2 + z^2} > 2.2\text{g}$.
  - `Gesture.Tap()` (`react-native-gesture-handler` v2): Tapping weak-spot markers on the ice block.
- **Visuals & Feedback:**
  - `IceOverlayCanvas` (`@shopify/react-native-skia`): Renders frost opacity tied to `iceHealth` (`100 -> 0`) and procedural jagged crack paths radiating from impact points.
  - `expo-haptics`: Heavy impact feedback on shakes, medium impact on taps, success notification on shatter.

### 3. Riddle 2: Gyroscope / Accelerometer Maze (`src/app/riddle/gyro-maze.tsx`)
- **Physics & Input:**
  - `useTiltGravity`: Maps `Accelerometer` $(x, y)$ at 16ms (~60 FPS) to `engine.world.gravity`.
  - `matter-js`: Rigid-body simulation with outer walls, internal maze barriers, player ball (top-left), and goal sensor (bottom-right).
- **Visuals & Feedback:**
  - `MazeCanvas` (`@shopify/react-native-skia`): Renders maze walls, goal zone, and ball position at 60 FPS.
  - Triggers light haptic feedback on wall collisions and solves the riddle when the ball enters the goal sensor.

### 4. Navigation Guard, Dashboard & Settings
- **Root Guard (`src/app/_layout.tsx`):** Wraps app in `GestureHandlerRootView`, checks `isMorningLocked()`, redirects to `/riddle/ice-cat` or `/riddle/gyro-maze`, and blocks Android hardware back navigation inside `/riddle/*`.
- **Dashboard (`src/app/(tabs)/index.tsx`):** Displays current lock status, active wake window, daily streak/solve state, and **"Test Ice Riddle"** / **"Test Maze Riddle"** buttons for instant testing at any time of day.
- **Settings (`src/app/(tabs)/settings.tsx`):** Configure wake-up window start/end times, preferred riddle mode, and Android blocked app packages.

