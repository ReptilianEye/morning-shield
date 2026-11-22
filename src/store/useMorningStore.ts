import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

export type RiddleId = 'ice-cat' | 'gyro-maze' | 'color-match' | 'sequence-tap';
export type RiddleChoice = RiddleId | 'random';

export type DailySolveTimes = Record<string, Partial<Record<RiddleId, number>>>;

export interface SolveTimeStats {
  todayMs: number | null;
  bestMs: number | null;
  previousMs: number | null;
}

export interface WakeWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface GuardedAppOption {
  id: string;
  label: string;
  androidPackage: string;
}

export const GUARDED_APP_OPTIONS: GuardedAppOption[] = [
  { id: 'instagram', label: 'Instagram', androidPackage: 'com.instagram.android' },
  { id: 'tiktok', label: 'TikTok', androidPackage: 'com.zhiliaoapp.musically' },
  { id: 'youtube', label: 'YouTube', androidPackage: 'com.google.android.youtube' },
  { id: 'x', label: 'X', androidPackage: 'com.twitter.android' },
  { id: 'reddit', label: 'Reddit', androidPackage: 'com.reddit.frontpage' },
  { id: 'snapchat', label: 'Snapchat', androidPackage: 'com.snapchat.android' },
];

export const DEFAULT_WAKE_WINDOW: WakeWindow = {
  startHour: 6,
  startMinute: 30,
  endHour: 8,
  endMinute: 30,
};

const memoryFallback = new Map<string, string>();

function createSafeStorage(): StateStorage {
  try {
    const mmkv = createMMKV({ id: 'morning-shield-store' });
    return {
      getItem: (name) => mmkv.getString(name) ?? null,
      setItem: (name, value) => {
        mmkv.set(name, value);
      },
      removeItem: (name) => {
        mmkv.remove(name);
      },
    };
  } catch {
    return {
      getItem: (name) => memoryFallback.get(name) ?? null,
      setItem: (name, value) => {
        memoryFallback.set(name, value);
      },
      removeItem: (name) => {
        memoryFallback.delete(name);
      },
    };
  }
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTime24(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatWakeWindow(window: WakeWindow): string {
  return `${formatTime24(window.startHour, window.startMinute)} – ${formatTime24(window.endHour, window.endMinute)}`;
}

/**
 * Formats a solve duration in milliseconds for user-facing display (e.g. "12.4s" or "1m 08s").
 */
export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '0.0s';
  const totalTenths = Math.round(ms / 100);
  if (totalTenths < 600) {
    return `${(totalTenths / 10).toFixed(1)}s`;
  }
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/**
 * Computes today's fastest time, overall personal best, and the most recent prior day's time.
 */
export function getSolveTimeStats(
  solveTimes: DailySolveTimes,
  riddleId: RiddleId,
  currentDateKey: string = getLocalDateKey()
): SolveTimeStats {
  const rawToday = solveTimes[currentDateKey]?.[riddleId];
  const todayMs =
    typeof rawToday === 'number' && Number.isFinite(rawToday) && rawToday > 0 ? rawToday : null;

  let bestMs: number | null = null;
  let previousDateKey: string | null = null;
  let previousMs: number | null = null;

  for (const [dateKey, dayMap] of Object.entries(solveTimes)) {
    const duration = dayMap?.[riddleId];
    if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) {
      continue;
    }
    if (bestMs === null || duration < bestMs) {
      bestMs = duration;
    }
    if (dateKey < currentDateKey && (previousDateKey === null || dateKey > previousDateKey)) {
      previousDateKey = dateKey;
      previousMs = duration;
    }
  }

  return { todayMs, bestMs, previousMs };
}

/**
 * Builds a concise user-facing summary comparing a solve duration against personal records.
 */
export function formatSolveSummary(
  elapsedMs: number,
  stats: SolveTimeStats,
  isNewBest: boolean
): string {
  const solvedLabel = `Solved in ${formatDurationMs(elapsedMs)}`;
  const fasterDeltaMs =
    stats.previousMs !== null && stats.previousMs - elapsedMs >= 100
      ? stats.previousMs - elapsedMs
      : null;

  if (isNewBest) {
    return fasterDeltaMs !== null
      ? `${solvedLabel} • Personal Best! (${formatDurationMs(fasterDeltaMs)} faster)`
      : `${solvedLabel} • Personal Best!`;
  }

  if (fasterDeltaMs !== null) {
    const fasterText = `${formatDurationMs(fasterDeltaMs)} faster than last time`;
    if (stats.bestMs !== null && stats.bestMs < elapsedMs) {
      return `${solvedLabel} • ${fasterText} • Best: ${formatDurationMs(stats.bestMs)}`;
    }
    return `${solvedLabel} • ${fasterText}`;
  }

  if (stats.bestMs !== null) {
    return `${solvedLabel} • Best: ${formatDurationMs(stats.bestMs)}`;
  }

  return solvedLabel;
}

export type ActiveRiddleRoute =
  | '/riddle/ice-cat'
  | '/riddle/color-match'
  | '/riddle/sequence-tap'
  | '/riddle/gyro-maze';

/**
 * Resolves the target challenge route for automatic morning lock redirects.
 * Daily Mix ('random') rotates across implemented challenges by day of month.
 */
export function resolveActiveRiddleRoute(
  selectedRiddle: RiddleChoice,
  now: Date = new Date()
): ActiveRiddleRoute {
  if (selectedRiddle === 'ice-cat') return '/riddle/ice-cat';
  if (selectedRiddle === 'color-match') return '/riddle/color-match';
  if (selectedRiddle === 'sequence-tap') return '/riddle/sequence-tap';
  if (selectedRiddle === 'gyro-maze') return '/riddle/gyro-maze';

  const implemented: ActiveRiddleRoute[] = [
    '/riddle/ice-cat',
    '/riddle/color-match',
    '/riddle/sequence-tap',
  ];
  return implemented[now.getDate() % implemented.length];
}

function shiftTimeMinutes(hour: number, minute: number, deltaMinutes: number): { hour: number; minute: number } {
  const total = ((hour * 60 + minute + deltaMinutes) % 1440 + 1440) % 1440;
  return {
    hour: Math.floor(total / 60),
    minute: total % 60,
  };
}

export function isWithinWakeWindow(window: WakeWindow, now: Date = new Date()): boolean {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = window.startHour * 60 + window.startMinute;
  const endMinutes = window.endHour * 60 + window.endMinute;

  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export interface MorningState {
  shieldEnabled: boolean;
  wakeWindow: WakeWindow;
  selectedRiddle: RiddleChoice;
  notificationsEnabled: boolean;
  blockedApps: string[];
  lastSolvedDate: string | null;
  solveTimes: DailySolveTimes;

  setShieldEnabled: (enabled: boolean) => void;
  setWakeWindow: (window: WakeWindow) => void;
  adjustStartTime: (deltaMinutes: number) => void;
  adjustEndTime: (deltaMinutes: number) => void;
  setSelectedRiddle: (riddle: RiddleChoice) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  toggleBlockedApp: (appId: string) => void;
  markRiddleSolved: () => void;
  recordSolveTime: (riddleId: RiddleId, durationMs: number) => void;
  resetTodayCompletion: () => void;
  isMorningLocked: (now?: Date) => boolean;
}

export const useMorningStore = create<MorningState>()(
  persist(
    (set, get) => ({
      shieldEnabled: true,
      wakeWindow: DEFAULT_WAKE_WINDOW,
      selectedRiddle: 'random',
      notificationsEnabled: true,
      blockedApps: ['instagram', 'tiktok', 'youtube'],
      lastSolvedDate: null,
      solveTimes: {},

      setShieldEnabled: (shieldEnabled) => set({ shieldEnabled }),
      setWakeWindow: (wakeWindow) => set({ wakeWindow }),
      adjustStartTime: (deltaMinutes) =>
        set((state) => {
          const next = shiftTimeMinutes(
            state.wakeWindow.startHour,
            state.wakeWindow.startMinute,
            deltaMinutes
          );
          return {
            wakeWindow: {
              ...state.wakeWindow,
              startHour: next.hour,
              startMinute: next.minute,
            },
          };
        }),
      adjustEndTime: (deltaMinutes) =>
        set((state) => {
          const next = shiftTimeMinutes(
            state.wakeWindow.endHour,
            state.wakeWindow.endMinute,
            deltaMinutes
          );
          return {
            wakeWindow: {
              ...state.wakeWindow,
              endHour: next.hour,
              endMinute: next.minute,
            },
          };
        }),
      setSelectedRiddle: (selectedRiddle) => set({ selectedRiddle }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      toggleBlockedApp: (appId) =>
        set((state) => {
          const exists = state.blockedApps.includes(appId);
          return {
            blockedApps: exists
              ? state.blockedApps.filter((id) => id !== appId)
              : [...state.blockedApps, appId],
          };
        }),
      markRiddleSolved: () => set({ lastSolvedDate: getLocalDateKey() }),
      recordSolveTime: (riddleId, durationMs) => {
        if (!Number.isFinite(durationMs) || durationMs <= 0) return;
        const roundedMs = Math.max(1, Math.round(durationMs));
        const dateKey = getLocalDateKey();
        set((state) => {
          const dayTimes = state.solveTimes[dateKey] ?? {};
          const existingMs = dayTimes[riddleId];
          const nextMs =
            typeof existingMs === 'number' && Number.isFinite(existingMs) && existingMs > 0
              ? Math.min(existingMs, roundedMs)
              : roundedMs;
          return {
            solveTimes: {
              ...state.solveTimes,
              [dateKey]: {
                ...dayTimes,
                [riddleId]: nextMs,
              },
            },
          };
        });
      },
      resetTodayCompletion: () => set({ lastSolvedDate: null }),
      isMorningLocked: (now = new Date()) => {
        const state = get();
        if (!state.shieldEnabled) return false;
        if (!isWithinWakeWindow(state.wakeWindow, now)) return false;
        return state.lastSolvedDate !== getLocalDateKey(now);
      },
    }),
    {
      name: 'morning-shield-preferences',
      storage: createJSONStorage(createSafeStorage),
      partialize: (state) => ({
        shieldEnabled: state.shieldEnabled,
        wakeWindow: state.wakeWindow,
        selectedRiddle: state.selectedRiddle,
        notificationsEnabled: state.notificationsEnabled,
        blockedApps: state.blockedApps,
        lastSolvedDate: state.lastSolvedDate,
        solveTimes: state.solveTimes,
      }),
    }
  )
);
