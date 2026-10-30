import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import CameraScreen from '@/components/color-match-camera';
import ThemedPressable from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useColorCalculations } from '@/hooks/use-color-calculations';
import { useTheme } from '@/hooks/use-theme';
import { useRef, useState } from 'react';
import { ConfettiMethods, PIConfetti } from 'react-native-fast-confetti';

const COLOR_SIMILARITY_THRESHOLD = 80;
const W_HUE = 0.6;
const W_LIGHT = 0.25;
const W_SAT = 0.15;

export default function ColorMatchRiddleScreen() {
  const theme = useTheme();
  const { getRandomColors, compareHexAndHsl } = useColorCalculations();
  const confettiRef = useRef<ConfettiMethods>(null);

  const [isRolled, setRolled] = useState<boolean>(false);
  const [rolledColors, setRolledColors] = useState<string[]>(['white', 'white']);
  const [colorPicked, setColorPicked] = useState<number>(-1);
  const pickedColorValue = rolledColors[colorPicked];

  const [huntStarted, setHuntStarted] = useState<boolean>(false);
  const [huntOver, setHuntOver] = useState<boolean>(false);
  const [foundColor, setFoundColor] = useState<string>('#FFFFFF');
  const [colorSimilarity, setColorSimilarity] = useState<number>(0);

  const rollTheDice = () => {
    setRolled(true);
    setRolledColors(getRandomColors());
  };

  const startTheHunt = () => {
    setHuntStarted(true);
  };

  const onSetColor = (value: string) => {
    const similarity = (1 - compareHexAndHsl(value, pickedColorValue, W_HUE, W_LIGHT, W_SAT)) * 100;
    setFoundColor(value);
    setColorSimilarity(similarity);
    if (similarity >= COLOR_SIMILARITY_THRESHOLD) {
      setHuntOver(true);
      confettiRef.current?.restart();
    }
  }

  return (
    <ThemedView style={styles.container}>
      <PIConfetti ref={confettiRef} autoplay={false} gravity={1.0}>
        <PIConfetti.Origin blastPosition="top-center" count={100}>
          <PIConfetti.Flake size={16} />
        </PIConfetti.Origin>
      </PIConfetti>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="code" themeColor="textSecondary">
            PLACEHOLDER TEXT
          </ThemedText>
          <ThemedText type="title">🎨 Riddle 3: Color Match</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Using your phone&apos;s camera, find an object of a specific, randomly chosen color.
          </ThemedText>
        </View>

        {huntStarted ?
          <CameraScreen onSetColor={onSetColor} isOver={huntOver}>
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, margin: 12 }}>
              <ThemedView type='backgroundElement' style={{ borderRadius: 20, padding: 8, display: 'flex', flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
                <View style={{ height: 50, flexGrow: 1, backgroundColor: pickedColorValue, borderRadius: 16 }} />
                <ThemedText type='subtitle' style={{ width: 70, textAlign: 'center' }}>{Math.round(colorSimilarity)}%</ThemedText>
                <View style={{ height: 50, flexGrow: 1, backgroundColor: foundColor, borderRadius: 16 }} />
              </ThemedView>
            </View>
            {huntOver ?
              <ThemedView type='background' style={{ position: 'absolute', top: '30%', width: '100%', padding: 24 }}>
                <ThemedText type='subtitle' style={{ textAlign: 'center' }}>You made it!</ThemedText>
                <ThemedPressable content='← Back to Landing Screen'
                  onPress={() => router.back()} />
              </ThemedView>
              :
              <View style={styles.crosshair} />
            }
          </CameraScreen>
          :
          <ThemedView type="backgroundElement" style={styles.canvasPlaceholder}>
            <ThemedText type="subtitle" style={{ textAlign: 'center' }}>🌈 Find the colored object</ThemedText>
            {!isRolled ?
              <ThemedPressable onPress={rollTheDice} content='Roll the dice!'/>
              :
              <Animated.View entering={ZoomIn.duration(250)} style={styles.rolledContent}>
                <ThemedText type="bigger" themeColor="textSecondary" style={styles.centerText}>
                  Choose your color
                </ThemedText>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Pressable onPress={() => setColorPicked(0)}
                    style={{ height: 100, width: 100, backgroundColor: rolledColors[0], borderRadius: 16,
                      borderWidth: colorPicked === 0 ? 4 : 0, borderColor: theme['text'], borderStyle: 'solid',
                      }} />
                  <Pressable onPress={() => setColorPicked(1)}
                    style={{ height: 100, width: 100, backgroundColor: rolledColors[1], borderRadius: 16,
                      borderWidth: colorPicked === 1 ? 4 : 0, borderColor: theme['text'], borderStyle: 'solid',
                      }} />
                </View>
                <ThemedPressable disabled={colorPicked === -1} onPress={startTheHunt} content='Go for a hunt!'/>
              </Animated.View>
            }
          </ThemedView>
        }

        <ThemedPressable color='backgroundSelected' textType='smallBold' 
          onPress={() => router.back()} content='← Back to Landing Screen' />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 10,
  },
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
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  canvasPlaceholder: {
    flex: 1,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  rolledContent: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  backButton: {
    borderRadius: Spacing.three,
  },
  actionButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.three,
    alignItems: 'center',
    backgroundColor: 'purple',
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
