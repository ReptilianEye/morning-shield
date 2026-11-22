import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { ConfettiMethods, PIConfetti } from 'react-native-fast-confetti';

import CameraScreen from '@/components/color-match-camera';
import ThemedPressable from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorCalculations } from '@/hooks/use-color-calculations';
import { useTheme } from '@/hooks/use-theme';
import { getLocalDateKey, isWithinWakeWindow, useMorningStore } from '@/store/useMorningStore';

const COLOR_SIMILARITY_THRESHOLD = 80;
const W_HUE = 0.6;
const W_LIGHT = 0.25;
const W_SAT = 0.15;

export default function ColorMatchRiddleScreen() {
  const theme = useTheme();
  const markRiddleSolved = useMorningStore((state) => state.markRiddleSolved);
  const shieldEnabled = useMorningStore((state) => state.shieldEnabled);
  const wakeWindow = useMorningStore((state) => state.wakeWindow);
  const lastSolvedDate = useMorningStore((state) => state.lastSolvedDate);
  const isLockedMode =
    shieldEnabled && isWithinWakeWindow(wakeWindow) && lastSolvedDate !== getLocalDateKey();
  const { getRandomColors, compareHexAndHsl } = useColorCalculations();
  const confettiRef = useRef<ConfettiMethods>(null);

  const [isRolled, setRolled] = useState(false);
  const [rolledColors, setRolledColors] = useState<string[]>(['#4F46E5', '#F59E0B']);
  const [colorPicked, setColorPicked] = useState<number>(-1);
  const pickedColorValue = rolledColors[colorPicked] ?? '#4F46E5';

  const [huntStarted, setHuntStarted] = useState(false);
  const [huntOver, setHuntOver] = useState(false);
  const [foundColor, setFoundColor] = useState<string>('#CBD5E1');
  const [colorSimilarity, setColorSimilarity] = useState<number>(0);

  const rollTheDice = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRolled(true);
    setColorPicked(-1);
    setRolledColors(getRandomColors());
  }, [getRandomColors]);

  const startTheHunt = useCallback(() => {
    if (colorPicked === -1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setHuntStarted(true);
  }, [colorPicked]);

  const handleReset = useCallback(() => {
    setRolled(false);
    setColorPicked(-1);
    setHuntStarted(false);
    setHuntOver(false);
    setFoundColor('#CBD5E1');
    setColorSimilarity(0);
  }, []);

  const onSetColor = useCallback(
    (value: string) => {
      const similarity =
        (1 - compareHexAndHsl(value, pickedColorValue, W_HUE, W_LIGHT, W_SAT)) * 100;
      setFoundColor(value);
      setColorSimilarity(similarity);
      if (similarity >= COLOR_SIMILARITY_THRESHOLD) {
        setHuntOver(true);
        markRiddleSolved();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        confettiRef.current?.restart();
      }
    },
    [compareHexAndHsl, markRiddleSolved, pickedColorValue]
  );

  const roundedMatch = Math.max(0, Math.min(100, Math.round(colorSimilarity)));
  const matchColor =
    roundedMatch >= COLOR_SIMILARITY_THRESHOLD
      ? theme.success
      : roundedMatch >= 55
        ? '#F59E0B'
        : theme.text;

  const subtitleText = huntOver
    ? 'Color matched! Your morning shield is ready to unlock.'
    : huntStarted
      ? `Aim the center reticle at an object matching your target (${COLOR_SIMILARITY_THRESHOLD}%+ to unlock).`
      : isRolled
        ? colorPicked === -1
          ? 'Tap one of the two shades below to pick your target color.'
          : 'Great choice! Start the camera hunt when you are ready.'
        : 'Roll two random shades, choose one, and find a matching object around you.';

  return (
    <ThemedView style={styles.container}>
      <PIConfetti ref={confettiRef} autoplay={false} gravity={1.0}>
        <PIConfetti.Origin blastPosition="top-center" count={100}>
          <PIConfetti.Flake size={16} />
        </PIConfetti.Origin>
      </PIConfetti>

      <SafeAreaView style={styles.safeArea}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          {isLockedMode && !huntOver ? (
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
            CHALLENGE 3
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset color match"
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
          <ThemedText type="title">Color Match</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {subtitleText}
          </ThemedText>
        </View>

        {/* Main Content */}
        {huntStarted ? (
          <View style={styles.cameraStageWrapper}>
            <CameraScreen onSetColor={onSetColor} isOver={huntOver}>
              {/* Center Aim Reticle */}
              {!huntOver && (
                <View pointerEvents="none" style={styles.reticleContainer}>
                  <View style={styles.reticleOuter} />
                  <View style={styles.reticleDot} />
                </View>
              )}

              {/* Bottom Live Comparison HUD */}
              <View style={styles.hudWrapper}>
                <View
                  style={[
                    styles.hudCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}>
                  <View style={styles.swatchColumn}>
                    <View style={[styles.hudSwatch, { backgroundColor: pickedColorValue }]} />
                    <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.hudLabel}>
                      Target
                    </ThemedText>
                  </View>

                  <View style={styles.matchCenter}>
                    <ThemedText type="subtitle" style={{ color: matchColor }}>
                      {roundedMatch}%
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {huntOver ? 'Matched!' : 'Match'}
                    </ThemedText>
                  </View>

                  <View style={styles.swatchColumn}>
                    <View
                      style={[
                        styles.hudSwatch,
                        { backgroundColor: foundColor, borderColor: theme.border, borderWidth: 1 },
                      ]}
                    />
                    <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.hudLabel}>
                      Camera
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Victory Overlay */}
              {huntOver && (
                <Animated.View
                  entering={ZoomIn.duration(250)}
                  style={styles.victoryBackdrop}>
                  <View
                    style={[
                      styles.victoryCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}>
                    <View style={[styles.victoryBadge, { backgroundColor: theme.successSoft }]}>
                      <SymbolView
                        name={{ ios: 'checkmark.circle.fill' }}
                        size={34}
                        tintColor={theme.success}
                        fallback={<ThemedText style={{ fontSize: 30, lineHeight: 34 }}>✅</ThemedText>}
                      />
                    </View>
                    <ThemedText type="subtitle">Perfect Match!</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                      You matched {roundedMatch}% of your target color. Have a great morning!
                    </ThemedText>
                  </View>
                </Animated.View>
              )}
            </CameraScreen>

            {huntOver && (
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
            )}
          </View>
        ) : (
          <View
            style={[
              styles.stageCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}>
            {!isRolled ? (
              <View style={styles.emptyStage}>
                <View style={styles.paletteBadge}>
                  <SymbolView
                    name={{ ios: 'camera.viewfinder' }}
                    size={32}
                    tintColor="#D97706"
                    fallback={<ThemedText style={{ fontSize: 30, lineHeight: 34 }}>🎨</ThemedText>}
                  />
                </View>
                <ThemedText type="subtitle" style={styles.centerText}>
                  Find a Color Nearby
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.stageSubtext}>
                  Roll two fresh shades, pick your favorite, and scan something in your room that
                  matches.
                </ThemedText>
                <View style={styles.primaryCtaWrap}>
                  <ThemedPressable onPress={rollTheDice} content="Generate Colors" />
                </View>
              </View>
            ) : (
              <Animated.View entering={ZoomIn.duration(220)} style={styles.rolledStage}>
                <View style={styles.rolledHeader}>
                  <ThemedText type="subtitle" style={styles.centerText}>
                    Choose Your Target Shade
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                    Tap one swatch below to lock it in
                  </ThemedText>
                </View>

                <View style={styles.swatchGrid}>
                  {rolledColors.map((swatchColor, index) => {
                    const isSelected = colorPicked === index;
                    return (
                      <Pressable
                        key={`${swatchColor}-${index}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Choose color option ${index + 1}`}
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setColorPicked(index);
                        }}
                        style={({ pressed }) => [
                          styles.swatchOptionCard,
                          {
                            backgroundColor: swatchColor,
                            borderColor: isSelected ? theme.text : 'transparent',
                          },
                          pressed && styles.pressed,
                        ]}>
                        {isSelected ? (
                          <View style={styles.selectedChip}>
                            <SymbolView
                              name={{ ios: 'checkmark.circle.fill' }}
                              size={16}
                              tintColor="#16A34A"
                              fallback={<ThemedText type="smallBold">✓</ThemedText>}
                            />
                            <ThemedText type="smallBold" style={styles.selectedChipText}>
                              Selected
                            </ThemedText>
                          </View>
                        ) : (
                          <View style={styles.unselectedChip}>
                            <ThemedText type="smallBold" style={styles.unselectedChipText}>
                              Option {index + 1}
                            </ThemedText>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.rolledActions}>
                  <ThemedPressable
                    disabled={colorPicked === -1}
                    onPress={startTheHunt}
                    content="Start Camera Hunt"
                  />
                  <Pressable
                    accessibilityRole="button"
                    onPress={rollTheDice}
                    style={({ pressed }) => [
                      styles.rerollButton,
                      { backgroundColor: theme.backgroundSelected },
                      pressed && styles.pressed,
                    ]}>
                    <SymbolView
                      name={{ ios: 'dice.fill' }}
                      size={15}
                      tintColor={theme.text}
                      fallback={<ThemedText type="smallBold">🎲</ThemedText>}
                    />
                    <ThemedText type="smallBold">Reroll Colors</ThemedText>
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </View>
        )}
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
  stageCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    justifyContent: 'center',
  },
  emptyStage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  paletteBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stageSubtext: {
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: Spacing.three,
  },
  primaryCtaWrap: {
    width: '100%',
    maxWidth: 240,
  },
  rolledStage: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    gap: Spacing.three,
  },
  rolledHeader: {
    gap: 4,
    alignItems: 'center',
  },
  swatchGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  swatchOptionCard: {
    flex: 1,
    height: 156,
    borderRadius: 20,
    borderWidth: 3,
    padding: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  selectedChipText: {
    color: '#0F172A',
    fontSize: 12,
    lineHeight: 16,
  },
  unselectedChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  unselectedChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
  },
  rolledActions: {
    gap: 10,
  },
  rerollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
  },
  cameraStageWrapper: {
    flex: 1,
    gap: Spacing.three,
  },
  reticleContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 44,
    height: 44,
    marginTop: -22,
    marginLeft: -22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleOuter: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  reticleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  hudWrapper: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
  },
  hudCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    gap: 10,
  },
  swatchColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  hudSwatch: {
    width: '100%',
    height: 42,
    borderRadius: 12,
  },
  hudLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
  matchCenter: {
    minWidth: 74,
    alignItems: 'center',
  },
  victoryBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  victoryCard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  victoryBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
