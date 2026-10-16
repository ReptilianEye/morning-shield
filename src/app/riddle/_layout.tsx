import { Stack } from 'expo-router';

export default function RiddleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}>
      <Stack.Screen name="ice-cat" />
      <Stack.Screen name="gyro-maze" />
    </Stack>
  );
}
