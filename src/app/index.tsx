import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function LandingScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Top Header */}
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <ThemedText type="code" themeColor="textSecondary">
                MORNING ANTI-DOOMSCROLLING
              </ThemedText>
              <ThemedText type="title">MorningShield</ThemedText>
            </View>

            <Link href="/settings" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open settings dialog"
                style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}>
                <ThemedView type="backgroundElement" style={styles.settingsPill}>
                  <ThemedText type="smallBold">⚙️ Settings</ThemedText>
                </ThemedView>
              </Pressable>
            </Link>
          </View>

          {/* Morning Status Placeholder Card */}
          <ThemedView type="backgroundElement" style={styles.statusCard}>
            <View style={styles.statusBadgeRow}>
              <View style={styles.statusDot} />
              <ThemedText type="smallBold">STATUS PLACEHOLDER — UNLOCKED</ThemedText>
            </View>
            <ThemedText type="default" themeColor="textSecondary">
              Wake-up window: 06:30 – 08:30 (placeholder). Complete a morning riddle below to test
              the hardware-sensor challenges.
            </ThemedText>
          </ThemedView>

          {/* Riddles Section */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Morning Riddles</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Select a riddle placeholder to test navigation
            </ThemedText>
          </View>

          {/* Riddle 1 Link: Ice Cat */}
          <Link href="/riddle/ice-cat" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}>
              <ThemedView type="backgroundElement" style={styles.riddleCard}>
                <View style={styles.riddleHeaderRow}>
                  <ThemedText type="subtitle">🧊 Riddle 1: Ice Cat</ThemedText>
                  <ThemedText type="code">OPEN →</ThemedText>
                </View>
                <ThemedText type="default" themeColor="textSecondary">
                  Break the AI Cat out of a frosted Skia ice block by shaking the phone (&gt; 2.2g)
                  and tapping weak-spot markers.
                </ThemedText>
                <View style={styles.tagRow}>
                  <ThemedText type="code" style={styles.tag}>
                    Accelerometer
                  </ThemedText>
                  <ThemedText type="code" style={styles.tag}>
                    Gesture.Tap()
                  </ThemedText>
                  <ThemedText type="code" style={styles.tag}>
                    Skia Canvas
                  </ThemedText>
                </View>
              </ThemedView>
            </Pressable>
          </Link>

          {/* Riddle 2 Link: Gyro Maze */}
          <Link href="/riddle/gyro-maze" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}>
              <ThemedView type="backgroundElement" style={styles.riddleCard}>
                <View style={styles.riddleHeaderRow}>
                  <ThemedText type="subtitle">🌀 Riddle 2: Gyro Maze</ThemedText>
                  <ThemedText type="code">OPEN →</ThemedText>
                </View>
                <ThemedText type="default" themeColor="textSecondary">
                  Tilt your phone in 2D space to control gravity and guide the ball through a 60 FPS
                  Matter.js physics maze to the goal zone.
                </ThemedText>
                <View style={styles.tagRow}>
                  <ThemedText type="code" style={styles.tag}>
                    Tilt Gravity
                  </ThemedText>
                  <ThemedText type="code" style={styles.tag}>
                    Matter.js
                  </ThemedText>
                  <ThemedText type="code" style={styles.tag}>
                    Skia 60 FPS
                  </ThemedText>
                </View>
              </ThemedView>
            </Pressable>
          </Link>

          {/* Riddle 3 Link: Color Match */}
          <Link href="/riddle/color-match" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}>
              <ThemedView type="backgroundElement" style={styles.riddleCard}>
                <View style={styles.riddleHeaderRow}>
                  <ThemedText type="subtitle">🎨 Riddle 3: Color Match</ThemedText>
                  <ThemedText type="code">OPEN →</ThemedText>
                </View>
                <ThemedText type="default" themeColor="textSecondary">
                  Using your phone's camera, find an object of a specific, randomly chosen color.
                </ThemedText>
                <View style={styles.tagRow}>
                  <ThemedText type="code" style={styles.tag}>
                    Phone Camera
                  </ThemedText>
                  <ThemedText type="code" style={styles.tag}>
                    Gesture.Tap()
                  </ThemedText>
                  <ThemedText type="code" style={styles.tag}>
                    Skia Canvas
                  </ThemedText>
                </View>
              </ThemedView>
            </Pressable>
          </Link>

          {/* Settings Dialog Trigger Card */}
          <Link href="/settings" asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}>
              <ThemedView type="backgroundSelected" style={styles.dialogTriggerCard}>
                <View style={styles.riddleHeaderRow}>
                  <ThemedText type="smallBold">⚙️ Adjust App Settings (Dialog)</ThemedText>
                  <ThemedText type="code">MODAL</ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  Opens the settings modal dialog placeholder (wake window, riddle mode, and
                  Android app blocker configuration — TBD).
                </ThemedText>
              </ThemedView>
            </Pressable>
          </Link>
        </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  headerTextGroup: {
    flex: 1,
    gap: Spacing.half,
  },
  settingsButton: {
    borderRadius: Spacing.three,
  },
  settingsPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  statusCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  sectionHeader: {
    marginTop: Spacing.two,
    gap: Spacing.half,
  },
  cardPressable: {
    borderRadius: Spacing.four,
  },
  riddleCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  dialogTriggerCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  riddleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  tag: {
    fontSize: 11,
  },
  pressed: {
    opacity: 0.75,
  },
});
