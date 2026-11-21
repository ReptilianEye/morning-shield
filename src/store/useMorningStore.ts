import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

export type RiddleChoice = 'ice-cat' | 'gyro-maze' | 'color-match' | 'random';

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

export type ActiveRiddleRoute = '/riddle/ice-cat' | '/riddle/color-match' | '/riddle/gyro-maze';

/**
 * Resolves the target challenge route for automatic morning lock redirects.
 * Daily Mix ('random') alternates between implemented challenges by day of month.
 */
export function resolveActiveRiddleRoute(
  selectedRiddle: RiddleChoice,
  now: Date = new Date()
): ActiveRiddleRoute {
  if (selectedRiddle === 'ice-cat') return '/riddle/ice-cat';
  if (selectedRiddle === 'color-match') return '/riddle/color-match';
  if (selectedRiddle === 'gyro-maze') return '/riddle/gyro-maze';

  return now.getDate() % 2 === 0 ? '/riddle/color-match' : '/riddle/ice-cat';
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

  setShieldEnabled: (enabled: boolean) => void;
  setWakeWindow: (window: WakeWindow) => void;
  adjustStartTime: (deltaMinutes: number) => void;
  adjustEndTime: (deltaMinutes: number) => void;
  setSelectedRiddle: (riddle: RiddleChoice) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  toggleBlockedApp: (appId: string) => void;
  markRiddleSolved: () => void;
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
      }),
    }
  )
);
