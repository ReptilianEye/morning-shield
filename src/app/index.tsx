import { Link, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  formatTime24h,
  isWithinWakeWindow,
  RiddleMode,
  useMorningStore,
} from '@/store/useMorningStore';

const RIDDLE_MODE_LABELS: Record<RiddleMode, string> = {
  'ice-cat': '🧊 Ice Cat',
  'gyro-maze': '🌀 Gyro Maze',
  'color-match': '🎨 Color Match',
  random: '🎲 Random Daily',
};

export default function LandingScreen() {
  const wakeWindow = useMorningStore((s) => s.wakeWindow);
  const selectedRiddle = useMorningStore((s) => s.selectedRiddle);
  const notificationsEnabled = useMorningStore((s) => s.notificationsEnabled);
  const blockedApps = useMorningStore((s) => s.blockedApps);
  const lastSolvedDate = useMorningStore((s) => s.lastSolvedDate);
  const isMorningLocked = useMorningStore((s) => s.isMorningLocked);
  const isSolvedToday = useMorningStore((s) => s.isSolvedToday);
  const getTargetRiddleRoute = useMorningStore((s) => s.getTargetRiddleRoute);

  const locked = isMorningLocked();
  const solvedToday = isSolvedToday();
  const inWakeWindow = isWithinWakeWindow(wakeWindow);

  const windowFormatted = `${formatTime24h(
    wakeWindow.startHour,
    wakeWindow.startMinute
  )} – ${formatTime24h(wakeWindow.endHour, wakeWindow.endMinute)}`;

  const statusHeadline = locked
    ? 'MORNING SHIELD LOCKED — SOLVE RIDDLE'
    : solvedToday
      ? `UNLOCKED — SOLVED TODAY (${lastSolvedDate})`
      : 'STATUS — UNLOCKED (STANDBY)';

  const handleLaunchActiveChallenge = () => {
    router.push(getTargetRiddleRoute());
  };

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

          {/* Live Morning Status Card */}
          <ThemedView
            type="backgroundElement"
            style={[styles.statusCard, locked && styles.statusCardLocked]}>
            <View style={styles.statusBadgeRow}>
              <View style={[styles.statusDot, locked && styles.statusDotLocked]} />
              <ThemedText type="smallBold">{statusHeadline}</ThemedText>
            </View>

            <ThemedText type="default" themeColor="textSecondary">
              {locked
                ? `Your wake-up window (${windowFormatted}) is active. Complete your morning challenge (${RIDDLE_MODE_LABELS[selectedRiddle]}) to unlock ${blockedApps.length} guarded apps.`
                : solvedToday
                  ? `Great job! You completed today's morning riddle. Wake-up window (${windowFormatted}) is unlocked for the rest of the day.`
                  : `Wake-up window: ${windowFormatted} (${inWakeWindow ? 'active' : 'outside window'}). Preferred mode: ${RIDDLE_MODE_LABELS[selectedRiddle]}.`}
            </ThemedText>

            <View style={styles.statusMetaRow}>
              <ThemedText type="code" style={styles.metaChip}>
                ⏰ {windowFormatted}
              </ThemedText>
              <ThemedText type="code" style={styles.metaChip}>
                {RIDDLE_MODE_LABELS[selectedRiddle]}
              </ThemedText>
              <ThemedText type="code" style={styles.metaChip}>
                🛡️ {blockedApps.length} Apps
              </ThemedText>
              <ThemedText type="code" style={styles.metaChip}>
                🔔 {notificationsEnabled ? 'On' : 'Off'}
              </ThemedText>
            </View>

            {locked ? (
              <Pressable
                accessibilityRole="button"
                onPress={handleLaunchActiveChallenge}
                style={({ pressed }) => [styles.unlockCtaButton, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.unlockCtaText}>
                  🚀 Start Morning Challenge ({RIDDLE_MODE_LABELS[selectedRiddle]}) →
                </ThemedText>
              </Pressable>
            ) : null}
          </ThemedView>

          {/* Riddles Section */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Morning Riddles</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Select a hardware-sensor challenge below to test or solve your daily ritual
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
                  <ThemedText type="code">
                    {selectedRiddle === 'ice-cat' ? 'ACTIVE • OPEN →' : 'OPEN →'}
                  </ThemedText>
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
                  <ThemedText type="code">
                    {selectedRiddle === 'gyro-maze' ? 'ACTIVE • OPEN →' : 'OPEN →'}
                  </ThemedText>
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
                  <ThemedText type="code">
                    {selectedRiddle === 'color-match' ? 'ACTIVE • OPEN →' : 'OPEN →'}
                  </ThemedText>
                </View>
                <ThemedText type="default" themeColor="textSecondary">
                  Using your phone&apos;s camera, find an object of a specific, randomly chosen color.
                </ThemedText>
                <View style={styles.tagRow}>
                  <ThemedText type="code" style={styles.tag}>
                    PhoneCamera
                  </ThemedText>
                  <ThemedText type="code" style={styles.tag}>
                    AutoColorFetch
                  </ThemedText>
                  <ThemedText type="code" style={styles.tag}>
                    HSLComparator
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
                  Window: {windowFormatted} • Mode: {RIDDLE_MODE_LABELS[selectedRiddle]} •{' '}
                  {blockedApps.length} blocked apps • Notifications:{' '}
                  {notificationsEnabled ? 'Enabled' : 'Off'}
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
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  statusCardLocked: {
    borderColor: 'rgba(245, 158, 11, 0.65)',
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
  statusDotLocked: {
    backgroundColor: '#f59e0b',
  },
  statusMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.half,
  },
  metaChip: {
    fontSize: 11,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(150, 150, 150, 0.15)',
  },
  unlockCtaButton: {
    marginTop: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
  },
  unlockCtaText: {
    color: '#121212',
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
