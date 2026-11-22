import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';

import { SolveTimeBadge } from '@/components/SolveTimeBadge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSolveTimer } from '@/hooks/useSolveTimer';
import { useTheme } from '@/hooks/use-theme';
import {
  getLocalDateKey,
  getSolveTimeStats,
  isWithinWakeWindow,
  useMorningStore,
} from '@/store/useMorningStore';

const TOTAL_TILES = 20;
const TILE_SIZE = 50;
const ARENA_PADDING = 14;
const CELL_MARGIN = 4;

type SequenceDirection = 'asc' | 'desc';

interface NumberTile {
  value: number;
  x: number;
  y: number;
}

/**
 * Places 20 shuffled numbers across a 4x6 jittered grid (choosing 20 of 24 cells)
 * so tiles scatter organically in 2D without ever overlapping.
 */
function generateShuffledTiles(width: number, height: number): NumberTile[] {
  const cols = 4;
  const rows = 6;
  const innerW = Math.max(TILE_SIZE * cols, width - ARENA_PADDING * 2);
  const innerH = Math.max(TILE_SIZE * rows, height - ARENA_PADDING * 2);
  const cellW = innerW / cols;
  const cellH = innerH / rows;

  const cells: { col: number; row: number }[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({ col, row });
    }
  }

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const values = Array.from({ length: TOTAL_TILES }, (_, i) => i + 1);
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  const jitterXMax = Math.max(0, cellW - TILE_SIZE - CELL_MARGIN * 2);
  const jitterYMax = Math.max(0, cellH - TILE_SIZE - CELL_MARGIN * 2);

  return values.map((value, idx) => {
    const { col, row } = cells[idx];
    const x = ARENA_PADDING + col * cellW + CELL_MARGIN + Math.random() * jitterXMax;
    const y = ARENA_PADDING + row * cellH + CELL_MARGIN + Math.random() * jitterYMax;
    return { value, x, y };
  });
}

interface TileViewProps {
  tile: NumberTile;
  isCleared: boolean;
  isWrongFlash: boolean;
  onPress: (value: number) => void;
}

function NumberTileButton({ tile, isCleared, isWrongFlash, onPress }: TileViewProps) {
  const theme = useTheme();
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (isCleared) {
      scale.set(withTiming(0.65, { duration: 180 }));
      opacity.set(withTiming(0, { duration: 180 }));
    } else {
      scale.set(withTiming(1, { duration: 180 }));
      opacity.set(withTiming(1, { duration: 180 }));
    }
  }, [isCleared, opacity, scale]);

  useEffect(() => {
    if (isWrongFlash) {
      shakeX.set(
        withSequence(
          withTiming(-7, { duration: 45 }),
          withTiming(7, { duration: 45 }),
          withTiming(-5, { duration: 45 }),
          withTiming(5, { duration: 45 }),
          withTiming(0, { duration: 45 })
        )
      );
    }
  }, [isWrongFlash, shakeX]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: shakeX.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents={isCleared ? 'none' : 'auto'}
      style={[
        styles.tileWrapper,
        animatedStyle,
        {
          left: tile.x,
          top: tile.y,
        },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Number ${tile.value}`}
        disabled={isCleared}
        onPress={() => onPress(tile.value)}
        style={({ pressed }) => [
          styles.tileButton,
          {
            backgroundColor: isWrongFlash ? 'rgba(239, 68, 68, 0.16)' : theme.card,
            borderColor: isWrongFlash ? '#EF4444' : theme.border,
          },
          pressed && styles.tilePressed,
        ]}>
        <ThemedText
          type="bigger"
          style={[styles.tileText, isWrongFlash && styles.tileWrongText]}>
          {tile.value}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export default function SequenceTapRiddleScreen() {
  const theme = useTheme();
  const markRiddleSolved = useMorningStore((state) => state.markRiddleSolved);
  const shieldEnabled = useMorningStore((state) => state.shieldEnabled);
  const wakeWindow = useMorningStore((state) => state.wakeWindow);
  const lastSolvedDate = useMorningStore((state) => state.lastSolvedDate);
  const solveTimes = useMorningStore((state) => state.solveTimes);

  const isLockedMode =
    shieldEnabled && isWithinWakeWindow(wakeWindow) && lastSolvedDate !== getLocalDateKey();
  const { solveResult, completeSolve, resetTimer } = useSolveTimer('sequence-tap');
  const solveStats = useMemo(() => getSolveTimeStats(solveTimes, 'sequence-tap'), [solveTimes]);

  const [direction, setDirection] = useState<SequenceDirection>(() =>
    Math.random() < 0.5 ? 'asc' : 'desc'
  );
  const [arenaSize, setArenaSize] = useState({ width: 0, height: 0 });
  const [tiles, setTiles] = useState<NumberTile[]>([]);
  const [clearedValues, setClearedValues] = useState<number[]>([]);
  const [wrongTileValue, setWrongTileValue] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const arenaSizeRef = useRef({ width: 0, height: 0 });
  const clearedCountRef = useRef(0);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sequence = useMemo(
    () =>
      direction === 'asc'
        ? Array.from({ length: TOTAL_TILES }, (_, i) => i + 1)
        : Array.from({ length: TOTAL_TILES }, (_, i) => TOTAL_TILES - i),
    [direction]
  );

  const clearedCount = clearedValues.length;
  useEffect(() => {
    clearedCountRef.current = clearedCount;
  }, [clearedCount]);
  const isCompleted = clearedCount >= TOTAL_TILES;
  const expectedValue = sequence[clearedCount];

  useEffect(() => {
    return () => {
      if (wrongTimerRef.current) {
        clearTimeout(wrongTimerRef.current);
      }
    };
  }, []);

  const handleArenaLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) return;

    const prevSize = arenaSizeRef.current;
    const sizeChanged =
      Math.abs(width - prevSize.width) > 2 || Math.abs(height - prevSize.height) > 2;

    if (!sizeChanged) return;

    arenaSizeRef.current = { width, height };
    setArenaSize({ width, height });

    setTiles((prev) => {
      if (prev.length === 0 || clearedCountRef.current === 0) {
        return generateShuffledTiles(width, height);
      }
      const maxX = Math.max(ARENA_PADDING, width - ARENA_PADDING - TILE_SIZE);
      const maxY = Math.max(ARENA_PADDING, height - ARENA_PADDING - TILE_SIZE);
      return prev.map((t) => ({
        ...t,
        x: Math.max(ARENA_PADDING, Math.min(maxX, t.x)),
        y: Math.max(ARENA_PADDING, Math.min(maxY, t.y)),
      }));
    });
  }, []);

  const handleTilePress = useCallback(
    (value: number) => {
      if (isCompleted || expectedValue === undefined) return;

      if (value === expectedValue) {
        const nextCount = clearedCount + 1;
        if (nextCount >= TOTAL_TILES) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setStatusMessage('All numbers cleared! Your morning shield is ready to unlock.');
          markRiddleSolved();
          completeSolve();
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          setStatusMessage(null);
        }
        setWrongTileValue(null);
        setClearedValues((prev) => (prev.includes(value) ? prev : [...prev, value]));
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setWrongTileValue(value);
        setStatusMessage(
          direction === 'asc'
            ? 'Wrong number — keep tapping in ascending order.'
            : 'Wrong number — keep tapping in descending order.'
        );

        if (wrongTimerRef.current) {
          clearTimeout(wrongTimerRef.current);
        }
        wrongTimerRef.current = setTimeout(() => {
          setWrongTileValue(null);
        }, 380);
      }
    },
    [clearedCount, completeSolve, direction, expectedValue, isCompleted, markRiddleSolved]
  );

  const handleReset = useCallback(() => {
    const nextDirection: SequenceDirection = Math.random() < 0.5 ? 'asc' : 'desc';
    setDirection(nextDirection);
    setClearedValues([]);
    setWrongTileValue(null);
    setStatusMessage(null);
    resetTimer();

    const { width, height } = arenaSizeRef.current;
    if (width > 0 && height > 0) {
      setTiles(generateShuffledTiles(width, height));
    }
  }, [resetTimer]);

  const defaultSubtitle =
    direction === 'asc'
      ? `Tap the numbers from 1 to ${TOTAL_TILES} in ascending order.`
      : `Tap the numbers from ${TOTAL_TILES} down to 1 in descending order.`;

  const progressColor = isCompleted ? theme.success : '#0D9488';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          {isLockedMode && !isCompleted ? (
            <View
              style={[
                styles.navPill,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <SymbolView
                name={{ ios: 'lock.fill' }}
                size={13}
                tintColor={theme.textSecondary}
                fallback={<ThemedText type="smallBold">🔒</ThemedText>}
              />
              <ThemedText type="smallBold" themeColor="textSecondary">
                Locked
              </ThemedText>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to home"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.navPill,
                { backgroundColor: theme.card, borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={{ ios: 'chevron.left' }}
                size={14}
                tintColor={theme.text}
                fallback={<ThemedText type="smallBold">‹</ThemedText>}
              />
              <ThemedText type="smallBold">Back</ThemedText>
            </Pressable>
          )}

          <ThemedText type="eyebrow" themeColor="textSecondary">
            CHALLENGE 4
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Shuffle numbers"
            onPress={handleReset}
            style={({ pressed }) => [
              styles.navPill,
              { backgroundColor: theme.card, borderColor: theme.border },
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{ ios: 'arrow.counterclockwise' }}
              size={13}
              tintColor={theme.text}
              fallback={<ThemedText type="smallBold">↻</ThemedText>}
            />
            <ThemedText type="smallBold">Reset</ThemedText>
          </Pressable>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Sequence Tap</ThemedText>
          <ThemedText
            type="small"
            style={wrongTileValue !== null ? styles.errorText : undefined}
            themeColor={wrongTileValue !== null ? undefined : 'textSecondary'}>
            {statusMessage ?? defaultSubtitle}
          </ThemedText>
        </View>

        {/* Order & Progress Card */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}>
          <View style={styles.progressLabelRow}>
            <View style={styles.orderTag}>
              <SymbolView
                name={{
                  ios: direction === 'asc' ? 'arrow.up.right' : 'arrow.down.right',
                }}
                size={13}
                tintColor={progressColor}
                fallback={
                  <ThemedText type="smallBold" style={{ color: progressColor }}>
                    {direction === 'asc' ? '↗' : '↘'}
                  </ThemedText>
                }
              />
              <ThemedText type="smallBold">
                {direction === 'asc'
                  ? `Ascending (1 → ${TOTAL_TILES})`
                  : `Descending (${TOTAL_TILES} → 1)`}
              </ThemedText>
            </View>
            <ThemedText type="smallBold" style={{ color: progressColor }}>
              {isCompleted ? 'Done!' : `${clearedCount} / ${TOTAL_TILES}`}
            </ThemedText>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(clearedCount / TOTAL_TILES) * 100}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
        </View>

        {/* 2D Shuffled Number Arena */}
        <View
          onLayout={handleArenaLayout}
          style={[
            styles.arena,
            {
              backgroundColor: theme.backgroundSelected,
              borderColor: isCompleted ? theme.success : theme.border,
            },
          ]}>
          {arenaSize.width > 0 &&
            arenaSize.height > 0 &&
            tiles.map((tile) => {
              const clampedTile: NumberTile = {
                ...tile,
                x: Math.max(
                  ARENA_PADDING,
                  Math.min(arenaSize.width - ARENA_PADDING - TILE_SIZE, tile.x)
                ),
                y: Math.max(
                  ARENA_PADDING,
                  Math.min(arenaSize.height - ARENA_PADDING - TILE_SIZE, tile.y)
                ),
              };
              return (
                <NumberTileButton
                  key={`${direction}-${tile.value}`}
                  tile={clampedTile}
                  isCleared={clearedValues.includes(tile.value)}
                  isWrongFlash={wrongTileValue === tile.value}
                  onPress={handleTilePress}
                />
              );
            })}

          {isCompleted && (
            <View style={styles.completeOverlay}>
              <View style={[styles.completeBadge, { backgroundColor: theme.successSoft }]}>
                <SymbolView
                  name={{ ios: 'checkmark.circle.fill' }}
                  size={36}
                  tintColor={theme.success}
                  fallback={<ThemedText style={{ fontSize: 32, lineHeight: 36 }}>✅</ThemedText>}
                />
              </View>
              <ThemedText type="subtitle">Sequence Complete!</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                You cleared all {TOTAL_TILES} numbers in{' '}
                {direction === 'asc' ? 'ascending' : 'descending'} order.
              </ThemedText>
              {solveResult && (
                <SolveTimeBadge
                  elapsedMs={solveResult.elapsedMs}
                  isNewBest={solveResult.isNewBest}
                  stats={solveStats}
                />
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {isCompleted ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.finishButton,
                { backgroundColor: theme.success },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={styles.finishButtonText}>
                Start Your Day
              </ThemedText>
              <SymbolView
                name={{ ios: 'arrow.right' }}
                size={15}
                tintColor="#FFFFFF"
                fallback={<ThemedText style={styles.finishButtonText}>→</ThemedText>}
              />
            </Pressable>
          ) : (
            <View
              style={[
                styles.hintBar,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
              <View style={styles.hintItem}>
                <SymbolView
                  name={{ ios: 'hand.tap.fill' }}
                  size={15}
                  tintColor="#0D9488"
                  fallback={<ThemedText>👆</ThemedText>}
                />
                <ThemedText type="smallBold">
                  {direction === 'asc' ? 'Smallest to largest' : 'Largest to smallest'}
                </ThemedText>
              </View>
              <View style={[styles.hintDivider, { backgroundColor: theme.border }]} />
              <View style={styles.hintItem}>
                <SymbolView
                  name={{ ios: 'sparkles' }}
                  size={15}
                  tintColor={theme.accent}
                  fallback={<ThemedText>✨</ThemedText>}
                />
                <ThemedText type="smallBold">Clear all {TOTAL_TILES}</ThemedText>
              </View>
            </View>
          )}
        </View>
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: {
    gap: 4,
    minHeight: 80,
  },
  errorText: {
    color: '#EF4444',
  },
  progressCard: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  arena: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
  },
  tileWrapper: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  tileButton: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tilePressed: {
    transform: [{ scale: 0.94 }],
  },
  tileText: {
    fontVariant: ['tabular-nums'],
  },
  tileWrongText: {
    color: '#EF4444',
  },
  completeOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  completeBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    textAlign: 'center',
    maxWidth: 250,
  },
  footer: {
    paddingTop: 2,
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  hintDivider: {
    width: StyleSheet.hairlineWidth,
    height: 18,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: Spacing.four,
    borderRadius: 16,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.78,
  },
});
