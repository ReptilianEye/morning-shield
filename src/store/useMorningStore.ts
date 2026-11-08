import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import { createMMKV, type MMKV } from 'react-native-mmkv';

export type RiddleMode = 'ice-cat' | 'gyro-maze' | 'color-match' | 'random';

export interface WakeWindow {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface BlockedAppOption {
  packageName: string;
  label: string;
  icon: string;
}

export const PRESET_BLOCKED_APPS: BlockedAppOption[] = [
  { packageName: 'com.instagram.android', label: 'Instagram', icon: '📸' },
  { packageName: 'com.zhiliaoapp.musically', label: 'TikTok', icon: '🎵' },
  { packageName: 'com.google.android.youtube', label: 'YouTube', icon: '▶️' },
  { packageName: 'com.twitter.android', label: 'X (Twitter)', icon: '🐦' },
  { packageName: 'com.reddit.frontpage', label: 'Reddit', icon: '👽' },
];

export const DEFAULT_WAKE_WINDOW: WakeWindow = {
  startHour: 6,
  startMinute: 30,
  endHour: 8,
  endMinute: 30,
};

/**
 * Formats a Date object as local YYYY-MM-DD.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats hour & minute as HH:MM (24-hour).
 */
export function formatTime24h(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Checks whether a given Date falls within the configured wake-up window.
 * Supports both standard windows (e.g., 06:30 -> 08:30) and overnight wrap-around windows.
 */
export function isWithinWakeWindow(wakeWindow: WakeWindow, now: Date = new Date()): boolean {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = wakeWindow.startHour * 60 + wakeWindow.startMinute;
  const endMinutes = wakeWindow.endHour * 60 + wakeWindow.endMinute;

  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  // Overnight window (e.g., 23:30 -> 07:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

/**
 * Create a resilient StateStorage backed by react-native-mmkv when JSI/Nitro is available,
 * automatically falling back to an in-memory Map on Web, SSR, or test environments.
 */
function createResilientStorage(): StateStorage {
  const memoryFallback = new Map<string, string>();
  let mmkvInstance: MMKV | null = null;
  let mmkvInitialized = false;

  const getMMKV = (): MMKV | null => {
    if (mmkvInitialized) {
      return mmkvInstance;
    }
    mmkvInitialized = true;
    try {
      mmkvInstance = createMMKV({ id: 'morning-shield-storage' });
      return mmkvInstance;
    } catch {
      mmkvInstance = null;
      return null;
    }
  };

  return {
    getItem: (name: string): string | null => {
      const storage = getMMKV();
      if (storage) {
        try {
          return storage.getString(name) ?? null;
        } catch {
          // Fall through to in-memory map
        }
      }
      return memoryFallback.get(name) ?? null;
    },
    setItem: (name: string, value: string): void => {
      const storage = getMMKV();
      if (storage) {
        try {
          storage.set(name, value);
          return;
        } catch {
          // Fall through to in-memory map
        }
      }
      memoryFallback.set(name, value);
    },
    removeItem: (name: string): void => {
      const storage = getMMKV();
      if (storage) {
        try {
          storage.remove(name);
          return;
        } catch {
          // Fall through to in-memory map
        }
      }
      memoryFallback.delete(name);
    },
  };
}

export interface MorningStoreState {
  wakeWindow: WakeWindow;
  selectedRiddle: RiddleMode;
  lastSolvedDate: string | null;
  notificationsEnabled: boolean;
  blockedApps: string[];

  // Configuration actions
  setWakeWindow: (window: Partial<WakeWindow>) => void;
  adjustWakeTime: (target: 'start' | 'end', deltaMinutes: number) => void;
  setSelectedRiddle: (riddle: RiddleMode) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  toggleBlockedApp: (packageName: string) => void;

  // Morning lock & completion methods
  isMorningLocked: (now?: Date) => boolean;
  isSolvedToday: (now?: Date) => boolean;
  markRiddleSolved: (now?: Date) => void;
  resetDailyProgress: () => void;
  getTargetRiddleRoute: () => '/riddle/ice-cat' | '/riddle/gyro-maze' | '/riddle/color-match';
}

const RIDDLE_ROUTES = [
  '/riddle/ice-cat',
  '/riddle/gyro-maze',
  '/riddle/color-match',
] as const;

export const useMorningStore = create<MorningStoreState>()(
  persist(
    (set, get) => ({
      wakeWindow: DEFAULT_WAKE_WINDOW,
      selectedRiddle: 'ice-cat',
      lastSolvedDate: null,
      notificationsEnabled: false,
      blockedApps: [
        'com.instagram.android',
        'com.zhiliaoapp.musically',
        'com.google.android.youtube',
      ],

      setWakeWindow: (partialWindow) =>
        set((state) => ({
          wakeWindow: {
            ...state.wakeWindow,
            ...partialWindow,
          },
        })),

      adjustWakeTime: (target, deltaMinutes) =>
        set((state) => {
          const currentHour =
            target === 'start' ? state.wakeWindow.startHour : state.wakeWindow.endHour;
          const currentMinute =
            target === 'start' ? state.wakeWindow.startMinute : state.wakeWindow.endMinute;

          const totalMinutes =
            (((currentHour * 60 + currentMinute + deltaMinutes) % 1440) + 1440) % 1440;
          const nextHour = Math.floor(totalMinutes / 60);
          const nextMinute = totalMinutes % 60;

          if (target === 'start') {
            return {
              wakeWindow: {
                ...state.wakeWindow,
                startHour: nextHour,
                startMinute: nextMinute,
              },
            };
          }

          return {
            wakeWindow: {
              ...state.wakeWindow,
              endHour: nextHour,
              endMinute: nextMinute,
            },
          };
        }),

      setSelectedRiddle: (selectedRiddle) => set({ selectedRiddle }),

      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),

      toggleBlockedApp: (packageName) =>
        set((state) => {
          const exists = state.blockedApps.includes(packageName);
          return {
            blockedApps: exists
              ? state.blockedApps.filter((pkg) => pkg !== packageName)
              : [...state.blockedApps, packageName],
          };
        }),

      isSolvedToday: (now = new Date()) => {
        const today = getLocalDateString(now);
        return get().lastSolvedDate === today;
      },

      isMorningLocked: (now = new Date()) => {
        const { wakeWindow, lastSolvedDate } = get();
        const today = getLocalDateString(now);
        if (lastSolvedDate === today) {
          return false;
        }
        return isWithinWakeWindow(wakeWindow, now);
      },

      markRiddleSolved: (now = new Date()) => {
        set({ lastSolvedDate: getLocalDateString(now) });
      },

      resetDailyProgress: () => {
        set({ lastSolvedDate: null });
      },

      getTargetRiddleRoute: () => {
        const { selectedRiddle } = get();
        if (selectedRiddle === 'ice-cat') {
          return '/riddle/ice-cat';
        }
        if (selectedRiddle === 'gyro-maze') {
          return '/riddle/gyro-maze';
        }
        if (selectedRiddle === 'color-match') {
          return '/riddle/color-match';
        }
        const randomIndex = Math.floor(Math.random() * RIDDLE_ROUTES.length);
        return RIDDLE_ROUTES[randomIndex];
      },
    }),
    {
      name: 'morning-shield-store',
      storage: createJSONStorage(() => createResilientStorage()),
    }
  )
);
