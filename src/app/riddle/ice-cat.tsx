import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useShakeDetector } from '@/hooks/useShakeDetector';
import { useSolveTimer } from '@/hooks/useSolveTimer';
import { IceOverlayCanvas, ImpactPoint } from '@/components/IceOverlayCanvas';
import { IceCatIllustration } from '@/components/IceCatIllustration';
import { SolveTimeBadge } from '@/components/SolveTimeBadge';
import {
  getLocalDateKey,
  getSolveTimeStats,
  isWithinWakeWindow,
  useMorningStore,
} from '@/store/useMorningStore';

interface WeakSpot {
  id: string;
  xPercent: number;
  yPercent: number;
}

const INITIAL_WEAK_SPOTS: WeakSpot[] = [
  { id: 'ws-1', xPercent: 0.23, yPercent: 0.22 },
  { id: 'ws-2', xPercent: 0.78, yPercent: 0.34 },
  { id: 'ws-3', xPercent: 0.5, yPercent: 0.88 },
];

const WEAK_SPOT_HIT_RADIUS = 42;
const SHAKE_DAMAGE = 15;
const WEAK_SPOT_DAMAGE = 25;
const CHIP_DAMAGE = 5;

function PulsingWeakSpot({ x, y }: { x: number; y: number }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.18, { duration: 750 }),
        withTiming(0.95, { duration: 750 })
      ),
      -1,
      true
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.weakSpotMarker,
        animatedStyle,
        {
          left: x - 22,
          top: y - 22,
        },
      ]}>
      <View style={styles.weakSpotOuterRing} />
      <View style={styles.weakSpotInnerCore} />
    </Animated.View>
  );
}

export default function IceCatRiddleScreen() {
  const theme = useTheme();
  const markRiddleSolved = useMorningStore((state) => state.markRiddleSolved);
  const shieldEnabled = useMorningStore((state) => state.shieldEnabled);
  const wakeWindow = useMorningStore((state) => state.wakeWindow);
  const lastSolvedDate = useMorningStore((state) => state.lastSolvedDate);
  const solveTimes = useMorningStore((state) => state.solveTimes);
  const isLockedMode =
    shieldEnabled && isWithinWakeWindow(wakeWindow) && lastSolvedDate !== getLocalDateKey();
  const { solveResult, completeSolve, resetTimer } = useSolveTimer('ice-cat');
  const solveStats = useMemo(() => getSolveTimeStats(solveTimes, 'ice-cat'), [solveTimes]);

  const [iceHealth, setIceHealth] = useState(100);
  const [impactPoints, setImpactPoints] = useState<ImpactPoint[]>([]);
  const [weakSpots, setWeakSpots] = useState<WeakSpot[]>(INITIAL_WEAK_SPOTS);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [statusMessage, setStatusMessage] = useState(
    'Shake your phone or tap the glowing weak spots to crack the ice.'
  );

  const joltX = useSharedValue(0);
  const isBroken = iceHealth <= 0;

  useEffect(() => {
    if (!isBroken) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    markRiddleSolved();
    completeSolve();
  }, [completeSolve, isBroken, markRiddleSolved]);

  const triggerJolt = useCallback(
    (intensity: number) => {
      joltX.set(
        withSequence(
          withTiming(-intensity, { duration: 40 }),
          withTiming(intensity, { duration: 40 }),
          withTiming(-intensity * 0.5, { duration: 40 }),
          withTiming(0, { duration: 40 })
        )
      );
    },
    [joltX]
  );

  const arenaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: joltX.value }],
  }));

  const handleCanvasLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasDimensions({ width, height });
  }, []);

  const applyDamage = useCallback((amount: number, reason: string) => {
    setIceHealth((prevHealth) => {
      if (prevHealth <= 0) return prevHealth;
      return Math.max(0, prevHealth - amount);
    });
    setStatusMessage(reason);
  }, []);

  const handleShake = useCallback(() => {
    if (iceHealth <= 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    triggerJolt(7);

    const { width, height } = canvasDimensions;
    if (width > 0 && height > 0) {
      const shakeX = width * (0.28 + Math.random() * 0.44);
      const shakeY = height * (0.28 + Math.random() * 0.44);

      setImpactPoints((prev) => [
        ...prev,
        {
          id: `shake-${Date.now()}-${prev.length}`,
          x: shakeX,
          y: shakeY,
          radius: 125 + Math.random() * 35,
          branches: 7,
        },
      ]);
    }

    applyDamage(SHAKE_DAMAGE, 'Big crack from shaking! Keep going.');
  }, [iceHealth, canvasDimensions, applyDamage, triggerJolt]);

  useShakeDetector({
    onShake: handleShake,
    threshold: 2.2,
    interval: 80,
    cooldownMs: 380,
    enabled: !isBroken,
  });

  const handleTap = useCallback(
    (tapX: number, tapY: number) => {
      if (iceHealth <= 0) return;

      const { width, height } = canvasDimensions;
      if (width <= 0 || height <= 0) return;

      let hitWeakSpotIndex = -1;
      for (let i = 0; i < weakSpots.length; i++) {
        const spotX = weakSpots[i].xPercent * width;
        const spotY = weakSpots[i].yPercent * height;
        if (Math.hypot(tapX - spotX, tapY - spotY) <= WEAK_SPOT_HIT_RADIUS) {
          hitWeakSpotIndex = i;
          break;
        }
      }

      if (hitWeakSpotIndex !== -1) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
        triggerJolt(6);

        setWeakSpots((prev) =>
          prev.map((spot, index) =>
            index === hitWeakSpotIndex
              ? {
                  ...spot,
                  xPercent: 0.16 + Math.random() * 0.68,
                  yPercent: 0.18 + Math.random() * 0.64,
                }
              : spot
          )
        );

        setImpactPoints((prev) => [
          ...prev,
          {
            id: `weakspot-${Date.now()}-${prev.length}`,
            x: tapX,
            y: tapY,
            radius: 115,
            branches: 6,
          },
        ]);

        applyDamage(WEAK_SPOT_DAMAGE, 'Direct hit on a weak spot!');
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        triggerJolt(2.5);

        setImpactPoints((prev) => [
          ...prev,
          {
            id: `tap-${Date.now()}-${prev.length}`,
            x: tapX,
            y: tapY,
            radius: 52,
            branches: 4,
          },
        ]);

        applyDamage(CHIP_DAMAGE, 'Aim for the glowing rings for bigger cracks.');
      }
    },
    [iceHealth, canvasDimensions, weakSpots, applyDamage, triggerJolt]
  );

  const tapGesture = useMemo(() => {
    return Gesture.Tap()
      .enabled(!isBroken)
      .onEnd((event) => {
        runOnJS(handleTap)(event.x, event.y);
      });
  }, [isBroken, handleTap]);

  const handleReset = useCallback(() => {
    setIceHealth(100);
    setImpactPoints([]);
    setWeakSpots(INITIAL_WEAK_SPOTS);
    setStatusMessage('Shake your phone or tap the glowing weak spots to crack the ice.');
    resetTimer();
  }, [resetTimer]);

  const progressColor = isBroken
    ? theme.success
    : iceHealth > 50
      ? '#0EA5E9'
      : iceHealth > 25
        ? '#F59E0B'
        : '#EF4444';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          {isLockedMode && !isBroken ? (
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
            CHALLENGE 1
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset ice block"
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

        {/* Title & Subtitle */}
        <View style={styles.header}>
          <ThemedText type="title">Break the Ice Cat</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {isBroken ? 'You freed the cat! Morning shield is ready to unlock.' : statusMessage}
          </ThemedText>
        </View>

        {/* Ice Progress Card */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}>
          <View style={styles.progressLabelRow}>
            <ThemedText type="smallBold">
              {isBroken ? 'Ice Shattered' : 'Ice Remaining'}
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: progressColor }}>
              {isBroken ? 'Free!' : `${iceHealth}%`}
            </ThemedText>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${isBroken ? 100 : iceHealth}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
        </View>

        {/* Interactive Ice Block Arena */}
        <Animated.View
          style={[
            styles.canvasContainer,
            arenaAnimatedStyle,
            isBroken ? styles.canvasFreed : styles.canvasFrozen,
          ]}
          onLayout={handleCanvasLayout}>
          <GestureDetector gesture={tapGesture}>
            <View style={styles.canvasInteractiveArea}>
              <View style={styles.catStage}>
                <IceCatIllustration iceHealth={iceHealth} size={210} />
                <ThemedText type="subtitle" style={styles.catTitle}>
                  {isBroken
                    ? 'Warm & Awake!'
                    : iceHealth <= 50
                      ? 'Almost Free!'
                      : 'Chilly Cat Inside'}
                </ThemedText>
                <ThemedText type="small" style={styles.catSubtext}>
                  {isBroken
                    ? 'Great job breaking the morning chill.'
                    : 'Keep cracking the frost to warm them up.'}
                </ThemedText>
                {isBroken && solveResult && (
                  <SolveTimeBadge
                    elapsedMs={solveResult.elapsedMs}
                    isNewBest={solveResult.isNewBest}
                    stats={solveStats}
                    darkSurface
                  />
                )}
              </View>

              {/* Pulsing Weak-Spot Targets */}
              {!isBroken &&
                canvasDimensions.width > 0 &&
                canvasDimensions.height > 0 &&
                weakSpots.map((spot) => (
                  <PulsingWeakSpot
                    key={spot.id}
                    x={spot.xPercent * canvasDimensions.width}
                    y={spot.yPercent * canvasDimensions.height}
                  />
                ))}

              {/* Frost & Procedural Crack Layer */}
              {canvasDimensions.width > 0 && canvasDimensions.height > 0 && (
                <IceOverlayCanvas
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                  iceHealth={iceHealth}
                  impactPoints={impactPoints}
                />
              )}
            </View>
          </GestureDetector>
        </Animated.View>

        {/* Clean Footer */}
        <View style={styles.footer}>
          {isBroken ? (
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
                  name={{ ios: 'iphone.radiowaves.left.and.right' }}
                  size={16}
                  tintColor={theme.accent}
                  fallback={<ThemedText>📱</ThemedText>}
                />
                <ThemedText type="smallBold">Shake phone</ThemedText>
              </View>
              <View style={[styles.hintDivider, { backgroundColor: theme.border }]} />
              <View style={styles.hintItem}>
                <SymbolView
                  name={{ ios: 'hand.tap.fill' }}
                  size={16}
                  tintColor="#F59E0B"
                  fallback={<ThemedText>🎯</ThemedText>}
                />
                <ThemedText type="smallBold">Tap glowing spots</ThemedText>
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
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  canvasContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  canvasFrozen: {
    backgroundColor: '#0F1E33',
    borderColor: 'rgba(125, 211, 252, 0.45)',
  },
  canvasFreed: {
    backgroundColor: '#1E1B2E',
    borderColor: 'rgba(251, 191, 36, 0.55)',
  },
  canvasInteractiveArea: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: 6,
  },
  catTitle: {
    color: '#F8FAFC',
    textAlign: 'center',
  },
  catSubtext: {
    color: 'rgba(226, 232, 240, 0.85)',
    textAlign: 'center',
    maxWidth: 250,
  },
  weakSpotMarker: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  weakSpotOuterRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#FDE047',
    backgroundColor: 'rgba(253, 224, 71, 0.22)',
  },
  weakSpotInnerCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FEF9C3',
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
    gap: 8,
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
