import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useShakeDetector } from '@/hooks/useShakeDetector';
import { IceOverlayCanvas, ImpactPoint } from '@/components/IceOverlayCanvas';

interface WeakSpot {
  id: string;
  xPercent: number; // 0.0 to 1.0 (relative to canvas width)
  yPercent: number; // 0.0 to 1.0 (relative to canvas height)
}

const INITIAL_WEAK_SPOTS: WeakSpot[] = [
  { id: 'ws-1', xPercent: 0.3, yPercent: 0.35 },
  { id: 'ws-2', xPercent: 0.72, yPercent: 0.42 },
  { id: 'ws-3', xPercent: 0.5, yPercent: 0.7 },
];

const WEAK_SPOT_HIT_RADIUS = 36;
const SHAKE_DAMAGE = 15;
const WEAK_SPOT_DAMAGE = 25;
const CHIP_DAMAGE = 5;

export default function IceCatRiddleScreen() {
  const [iceHealth, setIceHealth] = useState(100);
  const [impactPoints, setImpactPoints] = useState<ImpactPoint[]>([]);
  const [weakSpots, setWeakSpots] = useState<WeakSpot[]>(INITIAL_WEAK_SPOTS);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [lastActionMessage, setLastActionMessage] = useState('Shake your phone or tap weak spots!');

  const isBroken = iceHealth <= 0;

  // Handle canvas layout to obtain exact pixel dimensions for Skia rendering
  const handleCanvasLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasDimensions({ width, height });
  }, []);

  // Damage helper
  const applyDamage = useCallback((amount: number, reason: string) => {
    setIceHealth((prevHealth) => {
      const nextHealth = Math.max(0, prevHealth - amount);
      if (nextHealth === 0 && prevHealth > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setLastActionMessage('🎉 ICE SHATTERED! The AI Cat is free!');
      } else {
        setLastActionMessage(reason);
      }
      return nextHealth;
    });
  }, []);

  // 1. Shake interaction
  const handleShake = useCallback(() => {
    if (iceHealth <= 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    // Spawn a shake crack near center or random spot
    const { width, height } = canvasDimensions;
    if (width > 0 && height > 0) {
      const shakeX = width * (0.3 + Math.random() * 0.4);
      const shakeY = height * (0.3 + Math.random() * 0.4);

      setImpactPoints((prev) => [
        ...prev,
        {
          id: `shake-${Date.now()}-${prev.length}`,
          x: shakeX,
          y: shakeY,
          radius: 120 + Math.random() * 30,
          branches: 7,
        },
      ]);
    }

    applyDamage(SHAKE_DAMAGE, '💥 Strong Shake detected! -15 Ice Health');
  }, [iceHealth, canvasDimensions, applyDamage]);

  // Hook up accelerometer shake detector
  useShakeDetector({
    onShake: handleShake,
    threshold: 2.2,
    interval: 80,
    cooldownMs: 380,
    enabled: !isBroken,
  });

  // 2. Tap gesture interaction (react-native-gesture-handler v2)
  const handleTap = useCallback(
    (tapX: number, tapY: number) => {
      if (iceHealth <= 0) return;

      const { width, height } = canvasDimensions;
      if (width <= 0 || height <= 0) return;

      // Check if tap hit any active weak-spot
      let hitWeakSpotIndex = -1;
      for (let i = 0; i < weakSpots.length; i++) {
        const spotX = weakSpots[i].xPercent * width;
        const spotY = weakSpots[i].yPercent * height;
        const distance = Math.hypot(tapX - spotX, tapY - spotY);

        if (distance <= WEAK_SPOT_HIT_RADIUS) {
          hitWeakSpotIndex = i;
          break;
        }
      }

      if (hitWeakSpotIndex !== -1) {
        // Critical hit on weak spot!
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

        // Move the hit weak spot to a new random location
        setWeakSpots((prev) =>
          prev.map((spot, index) =>
            index === hitWeakSpotIndex
              ? {
                  ...spot,
                  xPercent: 0.15 + Math.random() * 0.7,
                  yPercent: 0.2 + Math.random() * 0.6,
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
            radius: 110,
            branches: 6,
          },
        ]);

        applyDamage(WEAK_SPOT_DAMAGE, '🎯 Weak-spot struck! -25 Ice Health');
      } else {
        // Regular chip tap outside weak spots
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

        setImpactPoints((prev) => [
          ...prev,
          {
            id: `tap-${Date.now()}-${prev.length}`,
            x: tapX,
            y: tapY,
            radius: 50,
            branches: 4,
          },
        ]);

        applyDamage(CHIP_DAMAGE, '⛏️ Chipping ice... -5 Ice Health');
      }
    },
    [iceHealth, canvasDimensions, weakSpots, applyDamage]
  );

  // Configure Gesture.Tap()
  const tapGesture = useMemo(() => {
    return Gesture.Tap()
      .enabled(!isBroken)
      .onEnd((event) => {
        runOnJS(handleTap)(event.x, event.y);
      });
  }, [isBroken, handleTap]);

  // Reset helper for testing
  const handleReset = useCallback(() => {
    setIceHealth(100);
    setImpactPoints([]);
    setWeakSpots(INITIAL_WEAK_SPOTS);
    setLastActionMessage('Ice block restored! Shake or tap weak spots.');
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Screen Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <ThemedText type="code" themeColor="textSecondary">
              RIDDLE 1 • HARDWARE & SKIA
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset riddle"
              onPress={handleReset}
              style={({ pressed }) => [styles.resetPill, pressed && styles.pressed]}>
              <ThemedText type="code">↻ Reset</ThemedText>
            </Pressable>
          </View>
          <ThemedText type="title">🧊 Break the Ice Cat</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {lastActionMessage}
          </ThemedText>
        </View>

        {/* Ice Health Progress Bar */}
        <View style={styles.healthContainer}>
          <View style={styles.healthLabelRow}>
            <ThemedText type="smallBold">
              {isBroken ? '🎉 ICE SHATTERED' : `Ice Integrity: ${iceHealth}%`}
            </ThemedText>
            <ThemedText type="code" themeColor="textSecondary">
              {isBroken ? '100% FREED' : `${iceHealth} / 100 HP`}
            </ThemedText>
          </View>
          <View style={styles.healthTrack}>
            <View
              style={[
                styles.healthFill,
                {
                  width: `${iceHealth}%`,
                  backgroundColor:
                    iceHealth > 50 ? '#00b0ff' : iceHealth > 25 ? '#ff9100' : '#ff1744',
                },
              ]}
            />
          </View>
        </View>

        {/* Interactive Riddle Playground Area */}
        <View style={styles.canvasContainer} onLayout={handleCanvasLayout}>
          <GestureDetector gesture={tapGesture}>
            <View style={styles.canvasInteractiveArea}>
              {/* Underlying AI Cat Character Illustration */}
              <View style={styles.catIllustrationContainer}>
                <ThemedText style={styles.catEmoji}>
                  {isBroken ? '😸' : iceHealth < 40 ? '😿' : '🥶'}
                </ThemedText>
                <ThemedText type="subtitle">
                  {isBroken ? 'Warm AI Cat Awakened!' : 'Cyber Cat Trapped in Frost'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.catSubtext}>
                  {isBroken
                    ? 'Thank you for breaking the morning chill! You are ready to start your day.'
                    : 'The cold ice block is preventing wake-up. Shake device or strike glowing markers!'}
                </ThemedText>
              </View>

              {/* Weak-Spot Targets (Only visible when ice still has health) */}
              {!isBroken &&
                canvasDimensions.width > 0 &&
                canvasDimensions.height > 0 &&
                weakSpots.map((spot) => (
                  <View
                    key={spot.id}
                    pointerEvents="none"
                    style={[
                      styles.weakSpotMarker,
                      {
                        left: spot.xPercent * canvasDimensions.width - 20,
                        top: spot.yPercent * canvasDimensions.height - 20,
                      },
                    ]}>
                    <View style={styles.weakSpotRing} />
                    <View style={styles.weakSpotCenter} />
                  </View>
                ))}

              {/* Skia Procedural Crack & Frost Layer */}
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
        </View>

        {/* Action Controls & Navigation */}
        <View style={styles.footer}>
          {isBroken ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.finishButton, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={styles.finishButtonText}>
                ✨ Morning State Unlocked — Return Home
              </ThemedText>
            </Pressable>
          ) : (
            <View style={styles.instructionsRow}>
              <ThemedText type="code" style={styles.instructionPill}>
                📱 Shake &gt; 2.2g (-15 HP)
              </ThemedText>
              <ThemedText type="code" style={styles.instructionPill}>
                🎯 Tap Target (-25 HP)
              </ThemedText>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <ThemedView type="backgroundElement" style={styles.backButtonInner}>
              <ThemedText type="smallBold">← Back to Landing Screen</ThemedText>
            </ThemedView>
          </Pressable>
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
    padding: Spacing.four,
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.half,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150, 150, 150, 0.4)',
  },
  healthContainer: {
    gap: 6,
  },
  healthLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(150, 150, 150, 0.25)',
    overflow: 'hidden',
  },
  healthFill: {
    height: '100%',
    borderRadius: 5,
  },
  canvasContainer: {
    flex: 1,
    borderRadius: Spacing.four,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 30, 45, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(100, 180, 240, 0.3)',
  },
  canvasInteractiveArea: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIllustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  catEmoji: {
    fontSize: 90,
  },
  catSubtext: {
    textAlign: 'center',
    maxWidth: 260,
  },
  weakSpotMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  weakSpotRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#ffeb3b',
    backgroundColor: 'rgba(255, 235, 59, 0.2)',
  },
  weakSpotCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  footer: {
    gap: Spacing.two,
  },
  instructionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  instructionPill: {
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(100, 180, 255, 0.15)',
    color: '#80d8ff',
  },
  finishButton: {
    backgroundColor: '#00e676',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#000',
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
