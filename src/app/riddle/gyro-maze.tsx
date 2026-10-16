import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function GyroMazeRiddleScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="code" themeColor="textSecondary">
            RIDDLE 2 PLACEHOLDER
          </ThemedText>
          <ThemedText type="title">🌀 Gyroscope Maze</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Tilt your phone to steer the ball from top-left to the goal sensor at bottom-right.
          </ThemedText>
        </View>

        {/* Placeholder Canvas Area */}
        <ThemedView type="backgroundElement" style={styles.canvasPlaceholder}>
          <ThemedText type="subtitle">⚪ → 🎯 Physics Maze</ThemedText>
          <ThemedText type="code">Gravity Vector: (x: 0.00, y: 0.00)</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            [Matter.js 2D World + Skia 60 FPS MazeCanvas + useTiltGravity Hook will render here]
          </ThemedText>
        </ThemedView>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ThemedView type="backgroundSelected" style={styles.backButtonInner}>
            <ThemedText type="smallBold">← Back to Landing Screen</ThemedText>
          </ThemedView>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  canvasPlaceholder: {
    flex: 1,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  backButton: {
    borderRadius: Spacing.three,
  },
  backButtonInner: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
