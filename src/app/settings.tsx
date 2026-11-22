import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimePickerModal } from '@/components/TimePickerModal';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  formatTime24,
  getLocalDateKey,
  GUARDED_APP_OPTIONS,
  RiddleChoice,
  useMorningStore,
  WakeWindow,
} from '@/store/useMorningStore';
import { syncWakeUpNotification } from '@/utils/notifications';

interface ChallengeOption {
  id: RiddleChoice;
  title: string;
  subtitle: string;
  symbol: SFSymbol;
  fallbackEmoji: string;
  tint: string;
  badgeBg: string;
}

const CHALLENGE_OPTIONS: ChallengeOption[] = [
  {
    id: 'random',
    title: 'Daily Mix',
    subtitle: 'Rotates challenges automatically each morning',
    symbol: 'sparkles',
    fallbackEmoji: '✨',
    tint: '#4F46E5',
    badgeBg: 'rgba(79, 70, 229, 0.14)',
  },
  {
    id: 'ice-cat',
    title: 'Break the Ice Cat',
    subtitle: 'Shake & tap to crack the frozen barrier',
    symbol: 'snowflake',
    fallbackEmoji: '🧊',
    tint: '#0284C7',
    badgeBg: 'rgba(14, 165, 233, 0.14)',
  },
  {
    id: 'gyro-maze',
    title: 'Gyro Maze',
    subtitle: 'Tilt your phone to guide the orb home',
    symbol: 'circle.grid.cross.fill',
    fallbackEmoji: '🌀',
    tint: '#7C3AED',
    badgeBg: 'rgba(124, 58, 237, 0.14)',
  },
  {
    id: 'color-match',
    title: 'Color Match',
    subtitle: 'Scan a matching object with your camera',
    symbol: 'camera.viewfinder',
    fallbackEmoji: '🎨',
    tint: '#D97706',
    badgeBg: 'rgba(245, 158, 11, 0.16)',
  },
  {
    id: 'sequence-tap',
    title: 'Sequence Tap',
    subtitle: 'Tap shuffled numbers in ascending or descending order',
    symbol: 'number.square.fill',
    fallbackEmoji: '🔢',
    tint: '#0D9488',
    badgeBg: 'rgba(13, 148, 136, 0.14)',
  },
];

const WINDOW_PRESETS: { label: string; window: WakeWindow }[] = [
  {
    label: '06:00 – 08:00',
    window: { startHour: 6, startMinute: 0, endHour: 8, endMinute: 0 },
  },
  {
    label: '06:30 – 08:30',
    window: { startHour: 6, startMinute: 30, endHour: 8, endMinute: 30 },
  },
  {
    label: '07:30 – 09:30',
    window: { startHour: 7, startMinute: 30, endHour: 9, endMinute: 30 },
  },
];

function isSameWindow(a: WakeWindow, b: WakeWindow): boolean {
  return (
    a.startHour === b.startHour &&
    a.startMinute === b.startMinute &&
    a.endHour === b.endHour &&
    a.endMinute === b.endMinute
  );
}

export default function SettingsDialogScreen() {
  const theme = useTheme();
  const {
    shieldEnabled,
    wakeWindow,
    selectedRiddle,
    notificationsEnabled,
    blockedApps,
    lastSolvedDate,
    setShieldEnabled,
    setWakeWindow,
    adjustStartTime,
    adjustEndTime,
    setSelectedRiddle,
    setNotificationsEnabled,
    toggleBlockedApp,
    resetTodayCompletion,
  } = useMorningStore();

  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [reminderStatusNote, setReminderStatusNote] = useState<string | null>(null);

  const solvedToday = lastSolvedDate === getLocalDateKey();

  useEffect(() => {
    let active = true;
    syncWakeUpNotification({
      notificationsEnabled,
      shieldEnabled,
      wakeWindow,
      requestPermissionIfNeeded: false,
    }).then((result) => {
      if (!active) return;
      if (!notificationsEnabled || !shieldEnabled) {
        setReminderStatusNote(null);
      } else if (result.scheduled && result.scheduledTimeLabel) {
        setReminderStatusNote(`Daily reminder scheduled for ${result.scheduledTimeLabel}`);
      } else if (result.permissionStatus === 'denied') {
        setReminderStatusNote('Notifications are blocked in system settings.');
      } else {
        setReminderStatusNote(null);
      }
    });
    return () => {
      active = false;
    };
  }, [notificationsEnabled, shieldEnabled, wakeWindow]);

  const handleToggleNotifications = useCallback(
    async (nextValue: boolean) => {
      Haptics.selectionAsync().catch(() => {});
      setNotificationsEnabled(nextValue);
      const result = await syncWakeUpNotification({
        notificationsEnabled: nextValue,
        shieldEnabled,
        wakeWindow,
        requestPermissionIfNeeded: nextValue,
      });
      if (nextValue && shieldEnabled) {
        if (result.scheduled && result.scheduledTimeLabel) {
          setReminderStatusNote(`Daily reminder scheduled for ${result.scheduledTimeLabel}`);
        } else if (result.permissionStatus === 'denied') {
          setReminderStatusNote('Notifications are blocked in system settings.');
        }
      } else {
        setReminderStatusNote(null);
      }
    },
    [setNotificationsEnabled, shieldEnabled, wakeWindow]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        {/* Modal Handle */}
        <View style={styles.handleWrap}>
          <View style={[styles.modalHandle, { backgroundColor: theme.backgroundSelected }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <ThemedText type="eyebrow" themeColor="accent">
                PREFERENCES
              </ThemedText>
              <ThemedText type="title">Settings</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Customize your morning window, preferred challenge, and reminders.
              </ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close settings"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.closeIconBtn,
                { backgroundColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={{ ios: 'xmark' }}
                size={14}
                tintColor={theme.text}
                fallback={<ThemedText type="smallBold">✕</ThemedText>}
              />
            </Pressable>
          </View>

          {/* Section 1: Wake-Up Window */}
          <View style={styles.sectionBlock}>
            <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.sectionLabel}>
              MORNING SHIELD
            </ThemedText>

            <View
              style={[
                styles.card,
                styles.cardShadow,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <View style={styles.switchRow}>
                <View style={styles.switchTextGroup}>
                  <ThemedText type="smallBold">Enable Morning Shield</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Require a challenge during your wake-up window
                  </ThemedText>
                </View>
                <Switch
                  accessibilityLabel="Enable Morning Shield"
                  value={shieldEnabled}
                  onValueChange={(value) => {
                    Haptics.selectionAsync().catch(() => {});
                    setShieldEnabled(value);
                  }}
                  trackColor={{ false: theme.backgroundSelected, true: theme.accent }}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              {/* Start Time Stepper */}
              <View style={styles.timeRow}>
                <View style={styles.timeLabelGroup}>
                  <ThemedText type="smallBold">Starts at</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Shield activates
                  </ThemedText>
                </View>
                <View style={styles.stepperGroup}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Decrease start time by 15 minutes"
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      adjustStartTime(-15);
                    }}
                    style={({ pressed }) => [
                      styles.stepBtn,
                      { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <SymbolView
                      name={{ ios: 'minus' }}
                      size={13}
                      tintColor={theme.text}
                      fallback={<ThemedText type="smallBold">−</ThemedText>}
                    />
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Choose exact start time"
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setPickerTarget('start');
                    }}
                    style={({ pressed }) => [
                      styles.timePillBtn,
                      { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="bigger" style={styles.timeValue}>
                      {formatTime24(wakeWindow.startHour, wakeWindow.startMinute)}
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Increase start time by 15 minutes"
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      adjustStartTime(15);
                    }}
                    style={({ pressed }) => [
                      styles.stepBtn,
                      { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <SymbolView
                      name={{ ios: 'plus' }}
                      size={13}
                      tintColor={theme.text}
                      fallback={<ThemedText type="smallBold">+</ThemedText>}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              {/* End Time Stepper */}
              <View style={styles.timeRow}>
                <View style={styles.timeLabelGroup}>
                  <ThemedText type="smallBold">Ends at</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Shield lifts
                  </ThemedText>
                </View>
                <View style={styles.stepperGroup}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Decrease end time by 15 minutes"
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      adjustEndTime(-15);
                    }}
                    style={({ pressed }) => [
                      styles.stepBtn,
                      { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <SymbolView
                      name={{ ios: 'minus' }}
                      size={13}
                      tintColor={theme.text}
                      fallback={<ThemedText type="smallBold">−</ThemedText>}
                    />
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Choose exact end time"
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setPickerTarget('end');
                    }}
                    style={({ pressed }) => [
                      styles.timePillBtn,
                      { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="bigger" style={styles.timeValue}>
                      {formatTime24(wakeWindow.endHour, wakeWindow.endMinute)}
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Increase end time by 15 minutes"
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      adjustEndTime(15);
                    }}
                    style={({ pressed }) => [
                      styles.stepBtn,
                      { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <SymbolView
                      name={{ ios: 'plus' }}
                      size={13}
                      tintColor={theme.text}
                      fallback={<ThemedText type="smallBold">+</ThemedText>}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Quick Presets */}
              <View style={styles.presetRow}>
                {WINDOW_PRESETS.map((preset) => {
                  const active = isSameWindow(wakeWindow, preset.window);
                  return (
                    <Pressable
                      key={preset.label}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setWakeWindow(preset.window);
                      }}
                      style={({ pressed }) => [
                        styles.presetChip,
                        {
                          backgroundColor: active
                            ? theme.accentSoft
                            : theme.backgroundSelected,
                          borderColor: active ? theme.accent : 'transparent',
                        },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText
                        type="small"
                        style={[
                          styles.presetChipText,
                          { color: active ? theme.accent : theme.textSecondary },
                        ]}>
                        {preset.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section 2: Active Challenge Selection */}
          <View style={styles.sectionBlock}>
            <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.sectionLabel}>
              MORNING CHALLENGE
            </ThemedText>

            <View
              style={[
                styles.card,
                styles.cardShadow,
                styles.listCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              {CHALLENGE_OPTIONS.map((option, index) => {
                const isSelected = selectedRiddle === option.id;
                return (
                  <View key={option.id}>
                    {index > 0 && (
                      <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    )}
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedRiddle(option.id);
                      }}
                      style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}>
                      <View style={[styles.optionIconBadge, { backgroundColor: option.badgeBg }]}>
                        <SymbolView
                          name={{ ios: option.symbol }}
                          size={18}
                          tintColor={option.tint}
                          fallback={<ThemedText>{option.fallbackEmoji}</ThemedText>}
                        />
                      </View>
                      <View style={styles.optionTextGroup}>
                        <ThemedText type="smallBold">{option.title}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {option.subtitle}
                        </ThemedText>
                      </View>
                      {isSelected ? (
                        <SymbolView
                          name={{ ios: 'checkmark.circle.fill' }}
                          size={22}
                          tintColor={theme.accent}
                          fallback={
                            <ThemedText type="smallBold" style={{ color: theme.accent }}>
                              ✓
                            </ThemedText>
                          }
                        />
                      ) : (
                        <View
                          style={[styles.radioCircle, { borderColor: theme.backgroundSelected }]}
                        />
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Section 3: Reminders & Guarded Apps */}
          <View style={styles.sectionBlock}>
            <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.sectionLabel}>
              REMINDERS & GUARDED APPS
            </ThemedText>

            <View
              style={[
                styles.card,
                styles.cardShadow,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <View style={styles.switchRow}>
                <View style={styles.switchTextGroup}>
                  <ThemedText type="smallBold">Wake-Up Reminders</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Send a gentle nudge when your morning window begins
                  </ThemedText>
                  {reminderStatusNote && (
                    <ThemedText type="small" themeColor="accent" style={styles.reminderStatus}>
                      {reminderStatusNote}
                    </ThemedText>
                  )}
                </View>
                <Switch
                  accessibilityLabel="Wake-Up Reminders"
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: theme.backgroundSelected, true: theme.accent }}
                />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.border }]} />

              <View style={styles.appsBlock}>
                <View style={styles.appsHeaderRow}>
                  <ThemedText type="smallBold">Distracting Apps</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {blockedApps.length} selected
                  </ThemedText>
                </View>
                <View style={styles.appChipGrid}>
                  {GUARDED_APP_OPTIONS.map((app) => {
                    const selected = blockedApps.includes(app.id);
                    return (
                      <Pressable
                        key={app.id}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          toggleBlockedApp(app.id);
                        }}
                        style={({ pressed }) => [
                          styles.appChip,
                          {
                            backgroundColor: selected
                              ? theme.accentSoft
                              : theme.backgroundSelected,
                            borderColor: selected ? theme.accent : 'transparent',
                          },
                          pressed && styles.pressed,
                        ]}>
                        {selected && (
                          <SymbolView
                            name={{ ios: 'checkmark' }}
                            size={11}
                            tintColor={theme.accent}
                            fallback={
                              <ThemedText type="small" style={{ color: theme.accent }}>
                                ✓
                              </ThemedText>
                            }
                          />
                        )}
                        <ThemedText
                          type="small"
                          style={[
                            styles.appChipText,
                            { color: selected ? theme.accent : theme.text },
                          ]}>
                          {app.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* Optional Today Completion Status */}
          {solvedToday && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                resetTodayCompletion();
              }}
              style={({ pressed }) => [
                styles.resetTodayBtn,
                { backgroundColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Reset Today&apos;s Completion
              </ThemedText>
            </Pressable>
          )}

          {/* Done Button */}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.doneButton,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={styles.doneButtonText}>
              Done
            </ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>

      {pickerTarget !== null && (
        <TimePickerModal
          visible
          title={pickerTarget === 'start' ? 'Start Time' : 'End Time'}
          initialHour={pickerTarget === 'start' ? wakeWindow.startHour : wakeWindow.endHour}
          initialMinute={pickerTarget === 'start' ? wakeWindow.startMinute : wakeWindow.endMinute}
          onCancel={() => setPickerTarget(null)}
          onConfirm={(hour, minute) => {
            if (pickerTarget === 'start') {
              setWakeWindow({
                ...wakeWindow,
                startHour: hour,
                startMinute: minute,
              });
            } else {
              setWakeWindow({
                ...wakeWindow,
                endHour: hour,
                endMinute: minute,
              });
            }
            setPickerTarget(null);
          }}
        />
      )}
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
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  modalHandle: {
    width: 38,
    height: 5,
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerTextGroup: {
    flex: 1,
    gap: 4,
  },
  closeIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionLabel: {
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: 12,
  },
  listCard: {
    paddingVertical: 6,
    gap: 0,
  },
  cardShadow: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  switchTextGroup: {
    flex: 1,
    gap: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  timeLabelGroup: {
    gap: 1,
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  timePillBtn: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  reminderStatus: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 2,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  optionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextGroup: {
    flex: 1,
    gap: 1,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
  appsBlock: {
    gap: 10,
  },
  appsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  appChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  appChipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  resetTodayBtn: {
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneButton: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.78,
  },
});
