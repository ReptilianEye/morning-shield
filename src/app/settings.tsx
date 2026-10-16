import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function SettingsDialogScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerGroup}>
            <ThemedText type="code" themeColor="textSecondary">
              SETTINGS DIALOG (PLACEHOLDER)
            </ThemedText>
            <ThemedText type="subtitle">Adjust MorningShield Settings</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Exact controls and persistence parameters to be determined (TBD).
            </ThemedText>
          </View>

          {/* Placeholder 1: Wake-Up Window */}
          <ThemedView type="backgroundElement" style={styles.settingBlock}>
            <ThemedText type="smallBold">⏰ Morning Wake-Up Window (TBD)</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Placeholder for configuring start &amp; end time (e.g., 06:30 – 08:30) when the
              morning shield is active.
            </ThemedText>
          </ThemedView>

          {/* Placeholder 2: Riddle Preference */}
          <ThemedView type="backgroundElement" style={styles.settingBlock}>
            <ThemedText type="smallBold">🎮 Active Riddle Selection (TBD)</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Placeholder for selecting between Ice Cat, Gyro Maze, or Random daily rotation.
            </ThemedText>
          </ThemedView>

          {/* Placeholder 3: Notifications & Android Blocker */}
          <ThemedView type="backgroundElement" style={styles.settingBlock}>
            <ThemedText type="smallBold">🛡️ Notifications &amp; App Blocker (TBD)</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Placeholder for wake-up notification reminders and Android blocked app packages
              (Instagram, TikTok, YouTube, etc.).
            </ThemedText>
          </ThemedView>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
            <ThemedView type="backgroundSelected" style={styles.closeButtonInner}>
              <ThemedText type="smallBold">Close Dialog</ThemedText>
            </ThemedView>
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
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerGroup: {
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  settingBlock: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.one,
  },
  closeButton: {
    marginTop: Spacing.two,
    borderRadius: Spacing.three,
  },
  closeButtonInner: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
