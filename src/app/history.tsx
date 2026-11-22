import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';

import { SolveHistoryCalendar } from '@/components/SolveHistoryCalendar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CHALLENGE_BY_ID, CHALLENGE_CATALOG } from '@/constants/riddles';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  formatDateKeyLabel,
  formatDurationMs,
  getLocalDateKey,
  getRiddleHistorySummary,
  parseLocalDateKey,
  RiddleId,
  useMorningStore,
} from '@/store/useMorningStore';

function resolveInitialRiddleId(
  paramRiddle: string | string[] | undefined,
  solveTimes: ReturnType<typeof useMorningStore.getState>['solveTimes']
): RiddleId {
  const raw = Array.isArray(paramRiddle) ? paramRiddle[0] : paramRiddle;
  if (raw && raw in CHALLENGE_BY_ID) {
    return raw as RiddleId;
  }

  for (const item of CHALLENGE_CATALOG) {
    if (getRiddleHistorySummary(solveTimes, item.id).totalDays > 0) {
      return item.id;
    }
  }
  return 'ice-cat';
}

export default function SolveHistoryScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ riddle?: string | string[] }>();
  const solveTimes = useMorningStore((state) => state.solveTimes);

  const now = new Date();
  const todayKey = getLocalDateKey(now);
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();

  const [selectedRiddleId, setSelectedRiddleId] = useState<RiddleId>(() =>
    resolveInitialRiddleId(params.riddle, solveTimes)
  );
  const [visibleMonth, setVisibleMonth] = useState(() => ({
    year: currentYear,
    monthIndex: currentMonthIndex,
  }));
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);

  const activeChallenge = CHALLENGE_BY_ID[selectedRiddleId];

  const summary = useMemo(
    () => getRiddleHistorySummary(solveTimes, selectedRiddleId),
    [solveTimes, selectedRiddleId]
  );

  const dayCountsByRiddle = useMemo(() => {
    const counts: Record<RiddleId, number> = {
      'ice-cat': 0,
      'gyro-maze': 0,
      'color-match': 0,
      'sequence-tap': 0,
    };
    for (const dayMap of Object.values(solveTimes)) {
      for (const item of CHALLENGE_CATALOG) {
        const ms = dayMap?.[item.id];
        if (typeof ms === 'number' && Number.isFinite(ms) && ms > 0) {
          counts[item.id] += 1;
        }
      }
    }
    return counts;
  }, [solveTimes]);

  const selectedDayDuration = solveTimes[selectedDateKey]?.[selectedRiddleId];
  const hasSelectedDayTime =
    typeof selectedDayDuration === 'number' &&
    Number.isFinite(selectedDayDuration) &&
    selectedDayDuration > 0;

  const otherRiddlesOnSelectedDay = useMemo(() => {
    const dayMap = solveTimes[selectedDateKey];
    if (!dayMap) return [];
    return CHALLENGE_CATALOG.filter((item) => {
      if (item.id === selectedRiddleId) return false;
      const ms = dayMap[item.id];
      return typeof ms === 'number' && Number.isFinite(ms) && ms > 0;
    }).map((item) => ({
      challenge: item,
      durationMs: dayMap[item.id] as number,
    }));
  }, [solveTimes, selectedDateKey, selectedRiddleId]);

  const canGoNextMonth =
    visibleMonth.year < currentYear ||
    (visibleMonth.year === currentYear && visibleMonth.monthIndex < currentMonthIndex);

  const handlePrevMonth = () => {
    setVisibleMonth((prev) => {
      if (prev.monthIndex === 0) {
        return { year: prev.year - 1, monthIndex: 11 };
      }
      return { year: prev.year, monthIndex: prev.monthIndex - 1 };
    });
  };

  const handleNextMonth = () => {
    if (!canGoNextMonth) return;
    setVisibleMonth((prev) => {
      if (prev.monthIndex === 11) {
        return { year: prev.year + 1, monthIndex: 0 };
      }
      return { year: prev.year, monthIndex: prev.monthIndex + 1 };
    });
  };

  const handleJumpToDate = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    const parsed = parseLocalDateKey(dateKey);
    if (parsed) {
      setVisibleMonth({ year: parsed.getFullYear(), monthIndex: parsed.getMonth() });
    }
  };

  const selectedDeltaFromBestMs =
    hasSelectedDayTime && summary.bestMs !== null ? selectedDayDuration - summary.bestMs : null;

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
                PROGRESS
              </ThemedText>
              <ThemedText type="title">Solve History</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Browse daily solve times for each challenge on your calendar.
              </ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close solve history"
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

          {/* Per-Riddle Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.riddleStrip}>
            {CHALLENGE_CATALOG.map((item) => {
              const selected = item.id === selectedRiddleId;
              const count = dayCountsByRiddle[item.id];
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${item.title}${count > 0 ? `, ${count} days recorded` : ''}`}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setSelectedRiddleId(item.id);
                  }}
                  style={({ pressed }) => [
                    styles.riddleChip,
                    {
                      backgroundColor: selected ? item.badgeBg : theme.card,
                      borderColor: selected ? item.tint : theme.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <SymbolView
                    name={{ ios: item.symbol }}
                    size={15}
                    tintColor={selected ? item.tint : theme.textSecondary}
                    fallback={
                      <ThemedText type="small">{item.fallbackEmoji}</ThemedText>
                    }
                  />
                  <ThemedText
                    type="smallBold"
                    style={{ color: selected ? item.tint : theme.text }}>
                    {item.shortTitle}
                  </ThemedText>
                  {count > 0 && (
                    <View
                      style={[
                        styles.countBadge,
                        {
                          backgroundColor: selected ? item.tint : theme.backgroundSelected,
                        },
                      ]}>
                      <ThemedText
                        type="small"
                        style={[
                          styles.countBadgeText,
                          { color: selected ? '#FFFFFF' : theme.textSecondary },
                        ]}>
                        {count}
                      </ThemedText>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* KPI Summary Row */}
          <View style={styles.kpiRow}>
            <View
              style={[
                styles.kpiCard,
                styles.cardShadow,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <ThemedText type="small" themeColor="textSecondary">
                Personal Best
              </ThemedText>
              <ThemedText
                type="subtitle"
                style={[styles.kpiValue, { color: summary.bestMs !== null ? theme.success : theme.textSecondary }]}>
                {summary.bestMs !== null ? formatDurationMs(summary.bestMs) : '—'}
              </ThemedText>
            </View>

            <View
              style={[
                styles.kpiCard,
                styles.cardShadow,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <ThemedText type="small" themeColor="textSecondary">
                Average
              </ThemedText>
              <ThemedText type="subtitle" style={styles.kpiValue}>
                {summary.averageMs !== null ? formatDurationMs(summary.averageMs) : '—'}
              </ThemedText>
            </View>

            <View
              style={[
                styles.kpiCard,
                styles.cardShadow,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <ThemedText type="small" themeColor="textSecondary">
                Days Solved
              </ThemedText>
              <ThemedText type="subtitle" style={styles.kpiValue}>
                {summary.totalDays}
              </ThemedText>
            </View>
          </View>

          {/* Interactive Monthly Calendar */}
          <SolveHistoryCalendar
            challenge={activeChallenge}
            solveTimes={solveTimes}
            year={visibleMonth.year}
            monthIndex={visibleMonth.monthIndex}
            todayKey={todayKey}
            selectedDateKey={selectedDateKey}
            bestMs={summary.bestMs}
            canGoNextMonth={canGoNextMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onJumpToToday={() => handleJumpToDate(todayKey)}
            onSelectDate={setSelectedDateKey}
          />

          {/* Selected Day Details */}
          <View style={styles.sectionBlock}>
            <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.sectionLabel}>
              SELECTED DAY
            </ThemedText>

            <View
              style={[
                styles.card,
                styles.cardShadow,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <View style={styles.dayDetailHeader}>
                <View style={styles.dayDetailTitleGroup}>
                  <ThemedText type="bigger">{formatDateKeyLabel(selectedDateKey)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {activeChallenge.title}
                  </ThemedText>
                </View>

                {selectedDateKey === todayKey && (
                  <View style={[styles.todayPill, { backgroundColor: theme.accentSoft }]}>
                    <ThemedText type="smallBold" style={{ color: theme.accent }}>
                      Today
                    </ThemedText>
                  </View>
                )}
              </View>

              {hasSelectedDayTime ? (
                <View
                  style={[
                    styles.selectedTimeBanner,
                    {
                      backgroundColor:
                        selectedDeltaFromBestMs !== null && Math.round(selectedDeltaFromBestMs) <= 0
                          ? theme.successSoft
                          : activeChallenge.badgeBg,
                    },
                  ]}>
                  <View style={styles.selectedTimeLeft}>
                    <SymbolView
                      name={{ ios: 'timer' }}
                      size={18}
                      tintColor={
                        selectedDeltaFromBestMs !== null && Math.round(selectedDeltaFromBestMs) <= 0
                          ? theme.success
                          : activeChallenge.tint
                      }
                      fallback={<ThemedText>⏱</ThemedText>}
                    />
                    <ThemedText
                      type="subtitle"
                      style={[
                        styles.tabularNum,
                        {
                          color:
                            selectedDeltaFromBestMs !== null &&
                            Math.round(selectedDeltaFromBestMs) <= 0
                              ? theme.success
                              : activeChallenge.tint,
                        },
                      ]}>
                      {formatDurationMs(selectedDayDuration)}
                    </ThemedText>
                  </View>

                  <ThemedText
                    type="smallBold"
                    style={{
                      color:
                        selectedDeltaFromBestMs !== null && Math.round(selectedDeltaFromBestMs) <= 0
                          ? theme.success
                          : theme.textSecondary,
                    }}>
                    {selectedDeltaFromBestMs !== null && Math.round(selectedDeltaFromBestMs) <= 0
                      ? 'Personal Best!'
                      : selectedDeltaFromBestMs !== null
                        ? `+${formatDurationMs(selectedDeltaFromBestMs)} vs best`
                        : ''}
                  </ThemedText>
                </View>
              ) : (
                <View
                  style={[
                    styles.emptyDayBanner,
                    { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    No {activeChallenge.title} run recorded on this date.
                  </ThemedText>
                </View>
              )}

              {otherRiddlesOnSelectedDay.length > 0 && (
                <View style={[styles.otherRunsWrap, { borderTopColor: theme.border }]}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Also solved on this date
                  </ThemedText>
                  <View style={styles.otherRunsChips}>
                    {otherRiddlesOnSelectedDay.map(({ challenge, durationMs }) => (
                      <Pressable
                        key={challenge.id}
                        accessibilityRole="button"
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setSelectedRiddleId(challenge.id);
                        }}
                        style={({ pressed }) => [
                          styles.otherRunChip,
                          { backgroundColor: challenge.badgeBg },
                          pressed && styles.pressed,
                        ]}>
                        <SymbolView
                          name={{ ios: challenge.symbol }}
                          size={12}
                          tintColor={challenge.tint}
                          fallback={<ThemedText type="small">{challenge.fallbackEmoji}</ThemedText>}
                        />
                        <ThemedText type="smallBold" style={{ color: challenge.tint }}>
                          {challenge.shortTitle} · {formatDurationMs(durationMs)}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Recorded Runs Log */}
          <View style={styles.sectionBlock}>
            <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.sectionLabel}>
              RECORDED DAYS ({summary.totalDays})
            </ThemedText>

            {summary.entries.length > 0 ? (
              <View
                style={[
                  styles.card,
                  styles.listCard,
                  styles.cardShadow,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}>
                {summary.entries.map((entry, idx) => {
                  const isBest =
                    summary.bestMs !== null && Math.round(entry.durationMs) <= Math.round(summary.bestMs);
                  const isSelected = entry.dateKey === selectedDateKey;
                  return (
                    <Pressable
                      key={entry.dateKey}
                      accessibilityRole="button"
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        handleJumpToDate(entry.dateKey);
                      }}
                      style={({ pressed }) => [
                        styles.historyRow,
                        idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                        isSelected && { backgroundColor: activeChallenge.badgeBg },
                        pressed && styles.pressed,
                      ]}>
                      <View style={styles.historyRowLeft}>
                        <ThemedText type="smallBold">
                          {formatDateKeyLabel(entry.dateKey)}
                        </ThemedText>
                        {entry.dateKey === todayKey && (
                          <ThemedText type="small" style={{ color: theme.accent }}>
                            Today
                          </ThemedText>
                        )}
                      </View>

                      <View style={styles.historyRowRight}>
                        {isBest && (
                          <View style={[styles.bestTag, { backgroundColor: theme.successSoft }]}>
                            <ThemedText type="small" style={[styles.bestTagText, { color: theme.success }]}>
                              Best
                            </ThemedText>
                          </View>
                        )}
                        <ThemedText
                          type="smallBold"
                          style={[
                            styles.tabularNum,
                            { color: isBest ? theme.success : theme.text },
                          ]}>
                          {formatDurationMs(entry.durationMs)}
                        </ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View
                style={[
                  styles.card,
                  styles.emptyStateCard,
                  styles.cardShadow,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}>
                <SymbolView
                  name={{ ios: activeChallenge.symbol }}
                  size={28}
                  tintColor={activeChallenge.tint}
                  fallback={<ThemedText style={styles.emptyEmoji}>{activeChallenge.fallbackEmoji}</ThemedText>}
                />
                <ThemedText type="bigger" style={styles.centerText}>
                  No {activeChallenge.title} times yet
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                  Complete this challenge once to start tracking your daily speed on the calendar.
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.replace(activeChallenge.href)}
                  style={({ pressed }) => [
                    styles.tryChallengeBtn,
                    { backgroundColor: activeChallenge.tint },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold" style={styles.tryChallengeText}>
                    Try {activeChallenge.shortTitle}
                  </ThemedText>
                </Pressable>
              </View>
            )}
          </View>

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
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
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
  riddleStrip: {
    gap: 8,
    paddingVertical: 2,
  },
  riddleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  kpiValue: {
    fontVariant: ['tabular-nums'],
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
    padding: 0,
    overflow: 'hidden',
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
  dayDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  dayDetailTitleGroup: {
    flex: 1,
    gap: 2,
  },
  todayPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  selectedTimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectedTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyDayBanner: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  otherRunsWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    gap: 8,
  },
  otherRunsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  otherRunChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 13,
    gap: Spacing.two,
  },
  historyRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  historyRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bestTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  bestTagText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  tabularNum: {
    fontVariant: ['tabular-nums'],
  },
  emptyStateCard: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  centerText: {
    textAlign: 'center',
  },
  tryChallengeBtn: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  tryChallengeText: {
    color: '#FFFFFF',
  },
  doneButton: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
