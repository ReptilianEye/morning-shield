import { useEffect, useState } from 'react';
import { AppState, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router, Stack, usePathname } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';

import {
  getLocalDateKey,
  isWithinWakeWindow,
  resolveActiveRiddleRoute,
  useMorningStore,
} from '@/store/useMorningStore';
import { configureNotificationHandler, syncWakeUpNotification } from '@/utils/notifications';

SplashScreen.preventAutoHideAsync();
configureNotificationHandler();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const [clockTick, setClockTick] = useState(0);

  const shieldEnabled = useMorningStore((s) => s.shieldEnabled);
  const wakeWindow = useMorningStore((s) => s.wakeWindow);
  const selectedRiddle = useMorningStore((s) => s.selectedRiddle);
  const lastSolvedDate = useMorningStore((s) => s.lastSolvedDate);
  const notificationsEnabled = useMorningStore((s) => s.notificationsEnabled);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

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
      router.push(resolveActiveRiddleRoute(selectedRiddle, now));
    }
  }, [shieldEnabled, wakeWindow, selectedRiddle, lastSolvedDate, pathname, clockTick]);

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
