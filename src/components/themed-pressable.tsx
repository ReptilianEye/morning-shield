import { Spacing, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Pressable, PressableProps, StyleSheet } from 'react-native';
import { TextType, ThemedText } from './themed-text';

export type ThemedPressableProps = PressableProps & {
  content?: string | React.ReactNode;
  children?: React.ReactNode;
  color?: ThemeColor,
  textType?: TextType,
};

export default function ThemedPressable({ content, children, color = 'primary', textType = 'default', ...rest }: ThemedPressableProps) {
  const theme = useTheme();
  const renderContent = content ?? children;
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme[color] },
        pressed && styles.pressed,
      ]}
      {...rest}
    >
      {typeof renderContent === 'string' ? <ThemedText type={textType}>{renderContent}</ThemedText> : renderContent}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
