import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { Stack } from 'expo-router';

import { useMorningStore } from '@/store/useMorningStore';

export default function RiddleLayout() {
  const isMorningLocked = useMorningStore((s) => s.isMorningLocked);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      return isMorningLocked();
    });
    return () => subscription.remove();
  }, [isMorningLocked]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}>
      <Stack.Screen name="ice-cat" />
      <Stack.Screen name="gyro-maze" />
      <Stack.Screen name="color-match" />
    </Stack>
  );
}
