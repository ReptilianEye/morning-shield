import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import CameraScreen from '@/components/camera-screen';
import ThemedPressable from '@/components/themed-pressable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useState } from 'react';

function getRandomColors(): string[] {
  const randomHue = randomFromInterval(0, 360);
  const randomSaturation = randomFromInterval(40, 60);
  const randomLightness = randomFromInterval(30, 70);

  return [
    `hsl(${randomHue}, ${randomSaturation}%, ${randomLightness}%)`,
    `hsl(${(randomHue + 180) % 360}, ${randomSaturation}%, ${randomLightness}%)`,
  ];
}

function randomFromInterval(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

const hexToRgb = (hex: string) => {
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
};

const hslStringToRgb = (hslStr: string) => {
  const matches = hslStr.match(/[\d.]+/g);
  if (!matches || matches.length < 3) return { r: 0, g: 0, b: 0 };

  let h = parseFloat(matches[0]);
  let s = parseFloat(matches[1]) / 100;
  let l = parseFloat(matches[2]) / 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4)),
  };
};

const compareHexAndHsl = (hex: string, hsl: string): number => {
  const rgb1 = hexToRgb(hex);
  const rgb2 = hslStringToRgb(hsl);

  const rDiff = rgb1.r - rgb2.r;
  const gDiff = rgb1.g - rgb2.g;
  const bDiff = rgb1.b - rgb2.b;

  const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  const maxDistance = 441.67;

  const similarity = (1 - distance / maxDistance) * 100;
  return Math.round(similarity);
};

export default function ColorMatchRiddleScreen() {
  const theme = useTheme();
  const [isRolled, setRolled] = useState<boolean>(false);
  const [rolledColors, setRolledColors] = useState<string[]>(['white', 'white']);
  const [colorPicked, setColorPicked] = useState<number>(-1);
  const [huntStarted, setHuntStarted] = useState<boolean>(false);
  const [foundColor, setFoundColor] = useState<string>('#FFFFFF');
  const pickedColorValue = rolledColors[colorPicked];
  const [colorSimilarity, setColorSimilarity] = useState<number>(0);
  const [huntOver, setHuntOver] = useState<boolean>(false);

  const rollTheDice = () => {
    setRolled(true);
    setRolledColors(getRandomColors());
  };

  const startTheHunt = () => {
    setHuntStarted(true);
  };

  const onSetColor = (value: string) => {
    const similarity = compareHexAndHsl(value, pickedColorValue);
    setFoundColor(value);
    setColorSimilarity(similarity);
    if (similarity >= 80)
      setHuntOver(true);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="code" themeColor="textSecondary">
            CO TU MA BYĆ?
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
                <ThemedText type='subtitle' style={{ width: 70, textAlign: 'center' }}>{colorSimilarity}%</ThemedText>
                <View style={{ height: 50, flexGrow: 1, backgroundColor: foundColor, borderRadius: 16 }} />
              </ThemedView>
            </View>
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
