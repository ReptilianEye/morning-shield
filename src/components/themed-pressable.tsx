import { Spacing, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Pressable, PressableProps, StyleSheet } from 'react-native';
import { TextType, ThemedText } from './themed-text';

export type ThemedPressableProps = PressableProps & {
  content?: string | React.ReactNode;
  children?: React.ReactNode;
  color?: ThemeColor;
  textType?: TextType;
};

const SOLID_COLOR_KEYS: ThemeColor[] = ['primary', 'accent', 'success'];

export default function ThemedPressable({
  content,
  children,
  color = 'primary',
  textType = 'smallBold',
  disabled,
  style,
  ...rest
}: ThemedPressableProps) {
  const theme = useTheme();
  const renderContent = content ?? children;
  const usesLightText = SOLID_COLOR_KEYS.includes(color);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.button,
        { backgroundColor: theme[color] },
        disabled && styles.disabled,
        state.pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {typeof renderContent === 'string' ? (
        <ThemedText
          type={textType}
          style={usesLightText ? styles.lightText : undefined}>
          {renderContent}
        </ThemedText>
      ) : (
        renderContent
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightText: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.42,
  },
  pressed: {
    opacity: 0.82,
  },
});
