import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  DEFAULT_WAKE_WINDOW,
  formatTime24h,
  PRESET_BLOCKED_APPS,
  RiddleMode,
  useMorningStore,
} from '@/store/useMorningStore';

const RIDDLE_OPTIONS: {
  mode: RiddleMode;
  title: string;
  subtitle: string;
  badge: string;
}[] = [
  {
    mode: 'ice-cat',
    title: '🧊 Ice Cat',
    subtitle: 'Shake phone (> 2.2g) and tap weak spots to break the Skia frost',
    badge: 'SENSORS',
  },
  {
    mode: 'gyro-maze',
    title: '🌀 Gyro Maze',
    subtitle: 'Tilt device to steer a Matter.js ball through a 60 FPS maze',
    badge: 'PHYSICS',
  },
  {
    mode: 'color-match',
    title: '🎨 Color Match',
    subtitle: 'Use camera to hunt down a real-world object matching target color',
    badge: 'CAMERA',
  },
  {
    mode: 'random',
    title: '🎲 Random Daily',
    subtitle: 'Automatically rotate between riddles every morning',
    badge: 'ROTATE',
  },
];

export default function SettingsDialogScreen() {
  const wakeWindow = useMorningStore((s) => s.wakeWindow);
  const selectedRiddle = useMorningStore((s) => s.selectedRiddle);
  const notificationsEnabled = useMorningStore((s) => s.notificationsEnabled);
  const blockedApps = useMorningStore((s) => s.blockedApps);
  const lastSolvedDate = useMorningStore((s) => s.lastSolvedDate);

  const setWakeWindow = useMorningStore((s) => s.setWakeWindow);
  const adjustWakeTime = useMorningStore((s) => s.adjustWakeTime);
  const setSelectedRiddle = useMorningStore((s) => s.setSelectedRiddle);
  const setNotificationsEnabled = useMorningStore((s) => s.setNotificationsEnabled);
  const toggleBlockedApp = useMorningStore((s) => s.toggleBlockedApp);
  const isMorningLocked = useMorningStore((s) => s.isMorningLocked);
  const isSolvedToday = useMorningStore((s) => s.isSolvedToday);
  const markRiddleSolved = useMorningStore((s) => s.markRiddleSolved);
  const resetDailyProgress = useMorningStore((s) => s.resetDailyProgress);

  const [notificationStatusMsg, setNotificationStatusMsg] = useState<string | null>(null);

  const lockedNow = isMorningLocked();
  const solvedToday = isSolvedToday();

  const triggerSelectionHaptic = () => {
    Haptics.selectionAsync().catch(() => {});
  };

  const handleAdjustTime = (target: 'start' | 'end', deltaMinutes: number) => {
    triggerSelectionHaptic();
    adjustWakeTime(target, deltaMinutes);
  };

  const handleApplyWindowPreset = (
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number
  ) => {
    triggerSelectionHaptic();
    setWakeWindow({ startHour, startMinute, endHour, endMinute });
  };

  const handleActivateNowPreset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    const now = new Date();
    const startTotal = (((now.getHours() * 60 + now.getMinutes() - 15) % 1440) + 1440) % 1440;
    const endTotal = (now.getHours() * 60 + now.getMinutes() + 45) % 1440;

    setWakeWindow({
      startHour: Math.floor(startTotal / 60),
      startMinute: startTotal % 60,
      endHour: Math.floor(endTotal / 60),
      endMinute: endTotal % 60,
    });
    resetDailyProgress();
  };

  const handleToggleNotifications = async () => {
    triggerSelectionHaptic();
    const nextEnabled = !notificationsEnabled;

    if (!nextEnabled) {
      setNotificationsEnabled(false);
      if (Platform.OS !== 'web') {
        await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      }
      setNotificationStatusMsg('Morning wake-up notifications disabled.');
      return;
    }

    if (Platform.OS === 'web') {
      setNotificationsEnabled(true);
      setNotificationStatusMsg(
        `Scheduled daily reminder for ${formatTime24h(wakeWindow.startHour, wakeWindow.startMinute)} (simulated on Web).`
      );
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setNotificationsEnabled(false);
        setNotificationStatusMsg('Notification permission was not granted.');
        return;
      }

      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🛡️ MorningShield Wake-Up Challenge',
          body: 'Complete your morning sensor riddle to unlock your phone and beat doomscrolling!',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: wakeWindow.startHour,
          minute: wakeWindow.startMinute,
        },
      });

      setNotificationsEnabled(true);
      setNotificationStatusMsg(
        `Daily reminder scheduled for ${formatTime24h(wakeWindow.startHour, wakeWindow.startMinute)}.`
      );
    } catch {
      setNotificationsEnabled(true);
      setNotificationStatusMsg(
        `Reminder preference saved for ${formatTime24h(wakeWindow.startHour, wakeWindow.startMinute)}.`
      );
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerGroup}>
            <ThemedText type="code" themeColor="textSecondary">
              PERSISTENT CONFIGURATION • ZUSTAND + MMKV
            </ThemedText>
            <ThemedText type="subtitle">Adjust MorningShield Settings</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Changes are saved automatically and reflected across the app.
            </ThemedText>
          </View>

          {/* Section 1: Morning Wake-Up Window */}
          <ThemedView type="backgroundElement" style={styles.settingBlock}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="smallBold">⏰ Morning Wake-Up Window</ThemedText>
              <ThemedText type="code" style={styles.windowBadge}>
                {formatTime24h(wakeWindow.startHour, wakeWindow.startMinute)} –{' '}
                {formatTime24h(wakeWindow.endHour, wakeWindow.endMinute)}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              During this daily window, MorningShield locks into riddle mode until you solve a
              morning challenge.
            </ThemedText>

            {/* Start Time Stepper */}
            <View style={styles.timeRow}>
              <View>
                <ThemedText type="smallBold">Window Start</ThemedText>
                <ThemedText type="code" themeColor="textSecondary">
                  {formatTime24h(wakeWindow.startHour, wakeWindow.startMinute)}
                </ThemedText>
              </View>
              <View style={styles.stepperGroup}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease start time by 1 hour"
                  onPress={() => handleAdjustTime('start', -60)}
                  style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}>
                  <ThemedText type="code">-1h</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease start time by 15 minutes"
                  onPress={() => handleAdjustTime('start', -15)}
                  style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}>
                  <ThemedText type="code">-15m</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase start time by 15 minutes"
                  onPress={() => handleAdjustTime('start', 15)}
                  style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}>
                  <ThemedText type="code">+15m</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase start time by 1 hour"
                  onPress={() => handleAdjustTime('start', 60)}
                  style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}>
                  <ThemedText type="code">+1h</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* End Time Stepper */}
            <View style={styles.timeRow}>
              <View>
                <ThemedText type="smallBold">Window End</ThemedText>
                <ThemedText type="code" themeColor="textSecondary">
                  {formatTime24h(wakeWindow.endHour, wakeWindow.endMinute)}
                </ThemedText>
              </View>
              <View style={styles.stepperGroup}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease end time by 1 hour"
                  onPress={() => handleAdjustTime('end', -60)}
                  style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}>
                  <ThemedText type="code">-1h</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease end time by 15 minutes"
                  onPress={() => handleAdjustTime('end', -15)}
                  style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}>
                  <ThemedText type="code">-15m</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase end time by 15 minutes"
                  onPress={() => handleAdjustTime('end', 15)}
                  style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}>
                  <ThemedText type="code">+15m</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase end time by 1 hour"
                  onPress={() => handleAdjustTime('end', 60)}
                  style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}>
                  <ThemedText type="code">+1h</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => handleApplyWindowPreset(6, 0, 8, 0)}
                style={({ pressed }) => [styles.presetPill, pressed && styles.pressed]}>
                <ThemedText type="code">06:00–08:00</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  handleApplyWindowPreset(
                    DEFAULT_WAKE_WINDOW.startHour,
                    DEFAULT_WAKE_WINDOW.startMinute,
                    DEFAULT_WAKE_WINDOW.endHour,
                    DEFAULT_WAKE_WINDOW.endMinute
                  )
                }
                style={({ pressed }) => [styles.presetPill, pressed && styles.pressed]}>
                <ThemedText type="code">06:30–08:30</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => handleApplyWindowPreset(7, 0, 9, 0)}
                style={({ pressed }) => [styles.presetPill, pressed && styles.pressed]}>
                <ThemedText type="code">07:00–09:00</ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleActivateNowPreset}
                style={({ pressed }) => [styles.presetPillActiveNow, pressed && styles.pressed]}>
                <ThemedText type="code" style={styles.presetPillActiveNowText}>
                  ⚡ Active Now (Test)
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>

          {/* Section 2: Preferred Daily Riddle Selection */}
          <ThemedView type="backgroundElement" style={styles.settingBlock}>
            <ThemedText type="smallBold">🎮 Preferred Daily Riddle Mode</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Choose which hardware-sensor challenge launches during your wake-up window.
            </ThemedText>

            <View style={styles.optionList}>
              {RIDDLE_OPTIONS.map((option) => {
                const isSelected = selectedRiddle === option.mode;
                return (
                  <Pressable
                    key={option.mode}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    onPress={() => {
                      triggerSelectionHaptic();
                      setSelectedRiddle(option.mode);
                    }}
                    style={({ pressed }) => [
                      styles.riddleOptionCard,
                      isSelected && styles.riddleOptionCardSelected,
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.riddleOptionHeader}>
                      <ThemedText type="smallBold">
                        {isSelected ? '● ' : '○ '}
                        {option.title}
                      </ThemedText>
                      <ThemedText type="code" themeColor="textSecondary">
                        {option.badge}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {option.subtitle}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>

          {/* Section 3: Notifications & Android App Blocker */}
          <ThemedView type="backgroundElement" style={styles.settingBlock}>
            <ThemedText type="smallBold">🛡️ Wake-Up Notifications &amp; App Blocker</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Configure daily wake-up reminder alerts and select Android distraction packages to
              intercept during locked mornings.
            </ThemedText>

            {/* Notifications Toggle */}
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: notificationsEnabled }}
              onPress={handleToggleNotifications}
              style={({ pressed }) => [
                styles.toggleRow,
                notificationsEnabled && styles.toggleRowActive,
                pressed && styles.pressed,
              ]}>
              <View style={styles.toggleTextGroup}>
                <ThemedText type="smallBold">🔔 Daily Wake-Up Notification</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Fires at {formatTime24h(wakeWindow.startHour, wakeWindow.startMinute)} via
                  expo-notifications
                </ThemedText>
              </View>
              <ThemedText type="code">
                {notificationsEnabled ? 'ENABLED ✓' : 'OFF'}
              </ThemedText>
            </Pressable>

            {notificationStatusMsg ? (
              <ThemedText type="small" themeColor="textSecondary">
                {notificationStatusMsg}
              </ThemedText>
            ) : null}

            {/* Blocked Android Apps Selector */}
            <View style={styles.blockedSubheader}>
              <ThemedText type="smallBold">
                📱 Blocked Distraction Apps ({blockedApps.length} selected)
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Android UsageStats &amp; Overlay Guard targets:
              </ThemedText>
            </View>

            <View style={styles.appChipList}>
              {PRESET_BLOCKED_APPS.map((app) => {
                const isBlocked = blockedApps.includes(app.packageName);
                return (
                  <Pressable
                    key={app.packageName}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isBlocked }}
                    onPress={() => {
                      triggerSelectionHaptic();
                      toggleBlockedApp(app.packageName);
                    }}
                    style={({ pressed }) => [
                      styles.appRow,
                      isBlocked && styles.appRowSelected,
                      pressed && styles.pressed,
                    ]}>
                    <View style={styles.appRowLeft}>
                      <ThemedText type="smallBold">
                        {app.icon} {app.label}
                      </ThemedText>
                      <ThemedText type="code" themeColor="textSecondary" style={styles.pkgText}>
                        {app.packageName}
                      </ThemedText>
                    </View>
                    <ThemedText type="code">
                      {isBlocked ? '🛡️ BLOCKED' : '+ ALLOW'}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>

          {/* Section 4: Daily State & Testing Controls */}
          <ThemedView type="backgroundElement" style={styles.settingBlock}>
            <View style={styles.sectionHeaderRow}>
              <ThemedText type="smallBold">🧪 Daily Ritual Status &amp; Testing</ThemedText>
              <ThemedText type="code" themeColor="textSecondary">
                {lockedNow ? '🔒 LOCKED' : '🔓 UNLOCKED'}
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              Solved today: {solvedToday ? `Yes (${lastSolvedDate})` : 'Not yet solved today'}
            </ThemedText>

            <View style={styles.testActionsRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  triggerSelectionHaptic();
                  markRiddleSolved();
                }}
                style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}>
                <ThemedText type="code">✓ Mark Solved Today</ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  triggerSelectionHaptic();
                  resetDailyProgress();
                }}
                style={({ pressed }) => [styles.secondaryActionBtn, pressed && styles.pressed]}>
                <ThemedText type="code">↺ Reset Today&apos;s Solve</ThemedText>
              </Pressable>
            </View>
          </ThemedView>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <ThemedView type="backgroundSelected" style={styles.closeButtonInner}>
              <ThemedText type="smallBold">Done &amp; Return to Dashboard</ThemedText>
            </ThemedView>
          </Pressable>
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
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerGroup: {
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  settingBlock: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.two,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  windowBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(128, 90, 213, 0.2)',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.25)',
  },
  stepperGroup: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  stepperBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.35)',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  presetPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150, 150, 150, 0.4)',
  },
  presetPillActiveNow: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  presetPillActiveNowText: {
    color: '#fbbf24',
  },
  optionList: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  riddleOptionCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.25)',
    gap: Spacing.half,
  },
  riddleOptionCardSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
  },
  riddleOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.25)',
    gap: Spacing.two,
  },
  toggleRowActive: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  toggleTextGroup: {
    flex: 1,
    gap: 2,
  },
  blockedSubheader: {
    marginTop: Spacing.one,
    gap: 2,
  },
  appChipList: {
    gap: Spacing.one,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  appRowSelected: {
    borderColor: 'rgba(239, 68, 68, 0.6)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  appRowLeft: {
    gap: 2,
  },
  pkgText: {
    fontSize: 11,
  },
  testActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  secondaryActionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.35)',
  },
  closeButton: {
    marginTop: Spacing.one,
    borderRadius: Spacing.three,
  },
  closeButtonInner: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
