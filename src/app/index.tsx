import { Link } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  formatWakeWindow,
  getLocalDateKey,
  isWithinWakeWindow,
  useMorningStore,
} from '@/store/useMorningStore';

interface ChallengeItem {
  id: 'ice-cat' | 'gyro-maze' | 'color-match' | 'sequence-tap';
  href:
    | '/riddle/ice-cat'
    | '/riddle/gyro-maze'
    | '/riddle/color-match'
    | '/riddle/sequence-tap';
  title: string;
  description: string;
  tags: string[];
  symbol: SFSymbol;
  fallbackEmoji: string;
  tint: string;
  badgeBg: string;
}

const CHALLENGES: ChallengeItem[] = [
  {
    id: 'ice-cat',
    href: '/riddle/ice-cat',
    title: 'Break the Ice Cat',
    description:
      'Crack the frozen barrier and warm up the cat by shaking your phone and tapping glowing weak spots.',
    tags: ['Shake & Tap', 'Quick'],
    symbol: 'snowflake',
    fallbackEmoji: '🧊',
    tint: '#0284C7',
    badgeBg: 'rgba(14, 165, 233, 0.14)',
  },
  {
    id: 'gyro-maze',
    href: '/riddle/gyro-maze',
    title: 'Gyro Maze',
    description:
      'Tilt your phone gently to roll the orb through the maze and guide it into the goal zone.',
    tags: ['Tilt & Balance', 'Focus'],
    symbol: 'circle.grid.cross.fill',
    fallbackEmoji: '🌀',
    tint: '#7C3AED',
    badgeBg: 'rgba(124, 58, 237, 0.14)',
  },
  {
    id: 'color-match',
    href: '/riddle/color-match',
    title: 'Color Match',
    description:
      'Pick a target shade and find something around your room that matches using your camera.',
    tags: ['Camera Hunt', 'Active'],
    symbol: 'camera.viewfinder',
    fallbackEmoji: '🎨',
    tint: '#D97706',
    badgeBg: 'rgba(245, 158, 11, 0.16)',
  },
  {
    id: 'sequence-tap',
    href: '/riddle/sequence-tap',
    title: 'Sequence Tap',
    description:
      'Clear the scattered number tiles by tapping all 20 in ascending or descending order.',
    tags: ['Focus & Tap', 'Quick'],
    symbol: 'number.square.fill',
    fallbackEmoji: '🔢',
    tint: '#0D9488',
    badgeBg: 'rgba(13, 148, 136, 0.14)',
  },
];

export default function LandingScreen() {
  const theme = useTheme();
  const { shieldEnabled, wakeWindow, selectedRiddle, lastSolvedDate } = useMorningStore();
  const solvedToday = lastSolvedDate === getLocalDateKey();
  const inWindow = isWithinWakeWindow(wakeWindow);
  const isLocked = shieldEnabled && inWindow && !solvedToday;

  const statusLabel = !shieldEnabled
    ? 'Shield Paused'
    : isLocked
      ? 'Morning Lock Active'
      : solvedToday
        ? 'Completed Today'
        : 'Unlocked';

  const statusHeadline = !shieldEnabled
    ? 'Shield is paused'
    : isLocked
      ? 'Time to wake up'
      : solvedToday
        ? 'Great job this morning'
        : 'Ready for the day';

  const statusBody = !shieldEnabled
    ? 'Your morning shield is turned off in Settings. You can still practice any challenge below.'
    : isLocked
      ? 'Complete a morning challenge below to unlock your day and stay clear of distractions.'
      : solvedToday
        ? 'You already cleared today’s morning challenge. Feel free to play any activity again.'
        : 'Your morning shield keeps distracting apps away during your window. Try any challenge below whenever you like.';

  const statusDotColor = !shieldEnabled
    ? theme.textSecondary
    : isLocked
      ? '#F59E0B'
      : theme.success;

  const statusPillBg = !shieldEnabled
    ? theme.backgroundSelected
    : isLocked
      ? 'rgba(245, 158, 11, 0.16)'
      : theme.successSoft;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Top Header */}
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <ThemedText type="eyebrow" themeColor="accent">
                GOOD MORNING
              </ThemedText>
              <ThemedText type="title" numberOfLines={1} adjustsFontSizeToFit>
                MorningShield
              </ThemedText>
            </View>

            <Link href="/settings" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open settings"
                style={({ pressed }) => [styles.pressableRadius, pressed && styles.pressed]}>
                <View
                  style={[
                    styles.settingsButton,
                    styles.cardShadow,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}>
                  <SymbolView
                    name={{ ios: 'gearshape.fill' }}
                    size={18}
                    tintColor={theme.text}
                    fallback={<ThemedText>⚙️</ThemedText>}
                  />
                </View>
              </Pressable>
            </Link>
          </View>

          {/* Morning Status Card */}
          <View
            style={[
              styles.statusCard,
              styles.cardShadow,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}>
            <View style={styles.statusTopRow}>
              <View style={[styles.statusPill, { backgroundColor: statusPillBg }]}>
                <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
                <ThemedText type="smallBold" style={{ color: statusDotColor }}>
                  {statusLabel}
                </ThemedText>
              </View>
              <View style={[styles.windowPill, { backgroundColor: theme.backgroundSelected }]}>
                <SymbolView
                  name={{ ios: 'sun.max.fill' }}
                  size={13}
                  tintColor="#F59E0B"
                  fallback={<ThemedText type="small">☀️</ThemedText>}
                />
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {formatWakeWindow(wakeWindow)}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="subtitle">{statusHeadline}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {statusBody}
            </ThemedText>
          </View>

          {/* Challenges Section */}
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Morning Challenges</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Choose a quick activity to get moving
            </ThemedText>
          </View>

          <View style={styles.challengeList}>
            {CHALLENGES.map((challenge) => (
              <Link key={challenge.href} href={challenge.href} asChild>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}>
                  <View
                    style={[
                      styles.riddleCard,
                      styles.cardShadow,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}>
                    <View style={[styles.iconBadge, { backgroundColor: challenge.badgeBg }]}>
                      <SymbolView
                        name={{ ios: challenge.symbol }}
                        size={22}
                        tintColor={challenge.tint}
                        fallback={
                          <ThemedText style={styles.fallbackEmoji}>
                            {challenge.fallbackEmoji}
                          </ThemedText>
                        }
                      />
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.cardTitleRow}>
                        <ThemedText type="bigger" style={styles.cardTitle}>
                          {challenge.title}
                        </ThemedText>
                        <View
                          style={[
                            styles.chevronCircle,
                            { backgroundColor: theme.backgroundSelected },
                          ]}>
                          <SymbolView
                            name={{ ios: 'chevron.right' }}
                            size={12}
                            tintColor={theme.textSecondary}
                            fallback={
                              <ThemedText type="smallBold" themeColor="textSecondary">
                                ›
                              </ThemedText>
                            }
                          />
                        </View>
                      </View>

                      <ThemedText type="small" themeColor="textSecondary">
                        {challenge.description}
                      </ThemedText>

                      <View style={styles.tagRow}>
                        {selectedRiddle === challenge.id && (
                          <View style={[styles.tagPill, { backgroundColor: theme.accentSoft }]}>
                            <ThemedText
                              type="small"
                              style={[styles.tagText, { color: theme.accent }]}>
                              Preferred
                            </ThemedText>
                          </View>
                        )}
                        {challenge.tags.map((tag) => (
                          <View
                            key={tag}
                            style={[
                              styles.tagPill,
                              { backgroundColor: theme.backgroundSelected },
                            ]}>
                            <ThemedText
                              type="small"
                              themeColor="textSecondary"
                              style={styles.tagText}>
                              {tag}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Link>
            ))}
          </View>
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerTextGroup: {
    flex: 1,
    gap: 2,
  },
  pressableRadius: {
    borderRadius: 22,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
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
  statusCard: {
    padding: Spacing.three,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  windowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sectionHeader: {
    marginTop: 4,
    gap: 2,
  },
  challengeList: {
    gap: 12,
  },
  cardPressable: {
    borderRadius: 20,
  },
  riddleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  fallbackEmoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardTitle: {
    flex: 1,
  },
  chevronCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tagPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
});
