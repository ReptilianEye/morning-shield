import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { router, Stack, usePathname } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';

import {
  getLocalDateKey,
  isWithinWakeWindow,
  resolveActiveRiddleRoute,
  useMorningStore,
} from '@/store/useMorningStore';
import {
  configureNotificationHandler,
  isMorningReminderResponse,
  syncWakeUpNotification,
} from '@/utils/notifications';

SplashScreen.preventAutoHideAsync();
configureNotificationHandler();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const [clockTick, setClockTick] = useState(0);

  const pathnameRef = useRef(pathname);
  const isNavigatingToRiddleRef = useRef(false);
  const handledResponseKeyRef = useRef<string | null>(null);

  const shieldEnabled = useMorningStore((s) => s.shieldEnabled);
  const wakeWindow = useMorningStore((s) => s.wakeWindow);
  const selectedRiddle = useMorningStore((s) => s.selectedRiddle);
  const lastSolvedDate = useMorningStore((s) => s.lastSolvedDate);
  const notificationsEnabled = useMorningStore((s) => s.notificationsEnabled);

  useEffect(() => {
    pathnameRef.current = pathname;
    isNavigatingToRiddleRef.current = false;
  }, [pathname]);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const navigateToActiveRiddle = useCallback((now: Date = new Date()) => {
    if (pathnameRef.current.startsWith('/riddle/') || isNavigatingToRiddleRef.current) {
      return;
    }
    const { selectedRiddle: currentRiddle } = useMorningStore.getState();
    isNavigatingToRiddleRef.current = true;
    router.push(resolveActiveRiddleRoute(currentRiddle, now));
  }, []);

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      if (!isMorningReminderResponse(response)) {
        return;
      }

      const responseKey = `${response.notification.request.identifier}:${response.notification.date}:${response.actionIdentifier}`;
      if (handledResponseKeyRef.current === responseKey) {
        return;
      }
      handledResponseKeyRef.current = responseKey;

      try {
        Notifications.clearLastNotificationResponse();
      } catch {
        // Ignore on unsupported runtimes
      }

      const now = new Date();
      const { lastSolvedDate: currentLastSolvedDate } = useMorningStore.getState();
      if (currentLastSolvedDate === getLocalDateKey(now)) {
        return;
      }

      navigateToActiveRiddle(now);
    },
    [navigateToActiveRiddle]
  );

  // Handle cold-start and foreground/background notification taps
  useEffect(() => {
    if (Platform.OS === 'web') return;

    try {
      const lastResponse = Notifications.getLastNotificationResponse();
      if (lastResponse) {
        handleNotificationResponse(lastResponse);
      }
    } catch {
      // Ignore on unsupported runtimes
    }

    let subscription: Notifications.EventSubscription | null = null;
    try {
      subscription = Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );
    } catch {
      // Ignore on unsupported runtimes
    }

    return () => {
      subscription?.remove();
    };
  }, [handleNotificationResponse]);

  // Re-evaluate wake-up window on foreground resume and every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => setClockTick((t) => t + 1), 15000);
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setClockTick((t) => t + 1);
      }
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  // Keep daily wake-up notification schedule aligned with preferences
  useEffect(() => {
    syncWakeUpNotification({
      notificationsEnabled,
      shieldEnabled,
      wakeWindow,
      requestPermissionIfNeeded: false,
    }).catch(() => {});
  }, [notificationsEnabled, shieldEnabled, wakeWindow]);

  // Automatic Morning Lock redirect when landing on Home during an unsolved wake window
  useEffect(() => {
    const now = new Date();
    const locked =
      shieldEnabled &&
      isWithinWakeWindow(wakeWindow, now) &&
      lastSolvedDate !== getLocalDateKey(now);

    if (locked && pathname === '/') {
      navigateToActiveRiddle(now);
    }
  }, [
    shieldEnabled,
    wakeWindow,
    selectedRiddle,
    lastSolvedDate,
    pathname,
    clockTick,
    navigateToActiveRiddle,
  ]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: 'MorningShield',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: 'App Settings',
              headerShown: false,
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="riddle"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              gestureEnabled: false,
            }}
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
