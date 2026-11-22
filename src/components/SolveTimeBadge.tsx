import { StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { formatSolveSummary, SolveTimeStats } from '@/store/useMorningStore';

interface SolveTimeBadgeProps {
  elapsedMs: number;
  isNewBest: boolean;
  stats: SolveTimeStats;
  darkSurface?: boolean;
}

/**
 * Displays the completion duration and personal best / previous-day comparison pill.
 */
export function SolveTimeBadge({
  elapsedMs,
  isNewBest,
  stats,
  darkSurface = false,
}: SolveTimeBadgeProps) {
  const theme = useTheme();
  const summary = formatSolveSummary(elapsedMs, stats, isNewBest);
  const tintColor = darkSurface ? '#4ADE80' : theme.success;
  const backgroundColor = darkSurface ? 'rgba(34, 197, 94, 0.18)' : theme.successSoft;
  const borderColor = darkSurface ? 'rgba(74, 222, 128, 0.35)' : 'transparent';

  return (
    <View style={[styles.pill, { backgroundColor, borderColor, borderWidth: darkSurface ? 1 : 0 }]}>
      <SymbolView
        name={{ ios: 'timer' }}
        size={13}
        tintColor={tintColor}
        fallback={
          <ThemedText type="smallBold" style={{ color: tintColor }}>
            ⏱
          </ThemedText>
        }
      />
      <ThemedText type="smallBold" style={[styles.text, { color: tintColor }]}>
        {summary}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: '100%',
  },
  text: {
    flexShrink: 1,
    textAlign: 'center',
  },
});
