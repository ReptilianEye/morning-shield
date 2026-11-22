import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ChallengeMetadata } from '@/constants/riddles';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  DailySolveTimes,
  formatCompactDurationMs,
  formatDateKeyLabel,
  formatDurationMs,
  getMonthCalendarDays,
  getMonthStatsForRiddle,
} from '@/store/useMorningStore';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface SolveHistoryCalendarProps {
  challenge: ChallengeMetadata;
  solveTimes: DailySolveTimes;
  year: number;
  monthIndex: number;
  todayKey: string;
  selectedDateKey: string;
  bestMs: number | null;
  canGoNextMonth: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToToday: () => void;
  onSelectDate: (dateKey: string) => void;
}

/**
 * Monthly Monday-first calendar showing per-day solve times for the active challenge.
 */
export function SolveHistoryCalendar({
  challenge,
  solveTimes,
  year,
  monthIndex,
  todayKey,
  selectedDateKey,
  bestMs,
  canGoNextMonth,
  onPrevMonth,
  onNextMonth,
  onJumpToToday,
  onSelectDate,
}: SolveHistoryCalendarProps) {
  const theme = useTheme();

  const monthTitle = useMemo(() => {
    const anchor = new Date(year, monthIndex, 1, 12, 0, 0, 0);
    return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [year, monthIndex]);

  const calendarDays = useMemo(() => getMonthCalendarDays(year, monthIndex), [year, monthIndex]);

  const monthStats = useMemo(
    () => getMonthStatsForRiddle(solveTimes, challenge.id, year, monthIndex),
    [solveTimes, challenge.id, year, monthIndex]
  );

  const weeks = useMemo(() => {
    const rows = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      rows.push(calendarDays.slice(i, i + 7));
    }
    return rows;
  }, [calendarDays]);

  const isViewingCurrentMonth = !canGoNextMonth;

  return (
    <View
      style={[
        styles.card,
        styles.cardShadow,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}>
      {/* Month Header & Controls */}
      <View style={styles.monthHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onPrevMonth();
          }}
          style={({ pressed }) => [
            styles.navBtn,
            { backgroundColor: theme.backgroundSelected },
            pressed && styles.pressed,
          ]}>
          <SymbolView
            name={{ ios: 'chevron.left' }}
            size={13}
            tintColor={theme.text}
            fallback={<ThemedText type="smallBold">‹</ThemedText>}
          />
        </Pressable>

        <View style={styles.monthTitleWrap}>
          <ThemedText type="subtitle" style={styles.monthTitleText}>
            {monthTitle}
          </ThemedText>
          {!isViewingCurrentMonth && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Jump to current month"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onJumpToToday();
              }}
              style={({ pressed }) => [
                styles.todayJumpPill,
                { backgroundColor: theme.accentSoft },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="small" style={[styles.todayJumpText, { color: theme.accent }]}>
                Today
              </ThemedText>
            </Pressable>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          disabled={!canGoNextMonth}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onNextMonth();
          }}
          style={({ pressed }) => [
            styles.navBtn,
            { backgroundColor: theme.backgroundSelected },
            !canGoNextMonth && styles.navBtnDisabled,
            pressed && canGoNextMonth && styles.pressed,
          ]}>
          <SymbolView
            name={{ ios: 'chevron.right' }}
            size={13}
            tintColor={canGoNextMonth ? theme.text : theme.textSecondary}
            fallback={
              <ThemedText
                type="smallBold"
                style={{ color: canGoNextMonth ? theme.text : theme.textSecondary }}>
                ›
              </ThemedText>
            }
          />
        </Pressable>
      </View>

      {/* Month Summary Strip */}
      <View style={[styles.monthSummaryBar, { backgroundColor: theme.backgroundSelected }]}>
        {monthStats.solvedCount > 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            <ThemedText type="smallBold" style={{ color: theme.text }}>
              {monthStats.solvedCount}
            </ThemedText>{' '}
            {monthStats.solvedCount === 1 ? 'day' : 'days'} solved
            {monthStats.monthBestMs !== null
              ? ` • Best ${formatDurationMs(monthStats.monthBestMs)}`
              : ''}
            {monthStats.monthAverageMs !== null
              ? ` • Avg ${formatDurationMs(monthStats.monthAverageMs)}`
              : ''}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            No {challenge.shortTitle} completions in {monthTitle}
          </ThemedText>
        )}
      </View>

      {/* Weekday Column Headers */}
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.weekdayText}>
              {label}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Calendar Weeks */}
      <View style={styles.grid}>
        {weeks.map((week) => (
          <View key={week[0].dateKey} style={styles.weekRow}>
            {week.map((cell) => {
              const durationMs = solveTimes[cell.dateKey]?.[challenge.id];
              const hasTime =
                cell.inCurrentMonth &&
                typeof durationMs === 'number' &&
                Number.isFinite(durationMs) &&
                durationMs > 0;
              const isBestDay =
                hasTime && bestMs !== null && Math.round(durationMs) <= Math.round(bestMs);
              const isSelected = cell.inCurrentMonth && cell.dateKey === selectedDateKey;
              const isToday = cell.inCurrentMonth && cell.dateKey === todayKey;
              const isFuture = cell.inCurrentMonth && cell.dateKey > todayKey;

              const cellBg = !cell.inCurrentMonth
                ? 'transparent'
                : isBestDay
                  ? theme.successSoft
                  : hasTime
                    ? challenge.badgeBg
                    : theme.background;

              const cellBorderColor = isSelected
                ? challenge.tint
                : isToday
                  ? theme.accent
                  : hasTime
                    ? isBestDay
                      ? theme.success
                      : challenge.tint
                    : 'transparent';

              const cellBorderWidth = 1.5;

              const dateReadable = formatDateKeyLabel(cell.dateKey);
              const accessibilityLabel = !cell.inCurrentMonth
                ? `${dateReadable}`
                : hasTime
                  ? `${dateReadable}, solved in ${formatDurationMs(durationMs)}${isBestDay ? ', personal best' : ''}`
                  : `${dateReadable}, no time recorded`;

              return (
                <Pressable
                  key={cell.dateKey}
                  accessibilityRole="button"
                  accessibilityLabel={accessibilityLabel}
                  accessibilityState={{ selected: isSelected, disabled: !cell.inCurrentMonth }}
                  disabled={!cell.inCurrentMonth}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    onSelectDate(cell.dateKey);
                  }}
                  style={({ pressed }) => [
                    styles.dayCell,
                    {
                      backgroundColor: cellBg,
                      borderColor: cellBorderColor,
                      borderWidth: cellBorderWidth,
                    },
                    !cell.inCurrentMonth && styles.outOfMonthCell,
                    isFuture && !hasTime && styles.futureDayCell,
                    pressed && cell.inCurrentMonth && styles.pressed,
                  ]}>
                  <View style={styles.dayTopRow}>
                    <ThemedText
                      type="small"
                      style={[
                        styles.dayNumber,
                        {
                          color: !cell.inCurrentMonth
                            ? theme.textSecondary
                            : isToday
                              ? theme.accent
                              : theme.text,
                          fontWeight: isToday || isSelected || hasTime ? '700' : '500',
                        },
                      ]}>
                      {cell.dayNumber}
                    </ThemedText>
                    {isBestDay && (
                      <View style={[styles.bestDot, { backgroundColor: theme.success }]} />
                    )}
                  </View>

                  {hasTime ? (
                    <ThemedText
                      type="small"
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[
                        styles.dayDuration,
                        { color: isBestDay ? theme.success : challenge.tint },
                      ]}>
                      {formatCompactDurationMs(durationMs)}
                    </ThemedText>
                  ) : (
                    <View style={styles.dayEmptySpacer} />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: challenge.badgeBg, borderColor: challenge.tint, borderWidth: 1 }]} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.legendText}>
            Solved day
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: theme.successSoft, borderColor: theme.success, borderWidth: 1 }]} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.legendText}>
            Personal best
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { borderColor: theme.accent, borderWidth: 1.5 }]} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.legendText}>
            Today
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: 12,
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
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  monthTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  monthTitleText: {
    textAlign: 'center',
  },
  todayJumpPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  todayJumpText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
  },
  monthSummaryBar: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    gap: 5,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 2,
  },
  weekdayText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  grid: {
    gap: 5,
  },
  dayCell: {
    flex: 1,
    minWidth: 0,
    minHeight: 50,
    borderRadius: 11,
    paddingHorizontal: 3,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  outOfMonthCell: {
    opacity: 0.25,
  },
  futureDayCell: {
    opacity: 0.55,
  },
  dayTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayNumber: {
    fontSize: 12,
    lineHeight: 15,
    fontVariant: ['tabular-nums'],
  },
  bestDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dayDuration: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  dayEmptySpacer: {
    height: 13,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 11,
    height: 11,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
});
