/**
 * Semantic light and dark theme tokens for MorningShield.
 */

import '@/global.css';

import { Platform } from 'react-native';

export type ThemeColor =
  | 'primary'
  | 'text'
  | 'textSecondary'
  | 'background'
  | 'backgroundElement'
  | 'backgroundSelected'
  | 'card'
  | 'border'
  | 'accent'
  | 'accentSoft'
  | 'success'
  | 'successSoft';

export const Colors: {
  light: Record<ThemeColor, string>;
  dark: Record<ThemeColor, string>;
} = {
  light: {
    primary: '#4F46E5',
    text: '#0F172A',
    textSecondary: '#5B6475',
    background: '#F5F7FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8ECF4',
    card: '#FFFFFF',
    border: 'rgba(15, 23, 42, 0.08)',
    accent: '#4F46E5',
    accentSoft: 'rgba(79, 70, 229, 0.10)',
    success: '#16A34A',
    successSoft: 'rgba(22, 163, 74, 0.12)',
  },
  dark: {
    primary: '#818CF8',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#0B1120',
    backgroundElement: '#151E32',
    backgroundSelected: '#1E293B',
    card: '#151E32',
    border: 'rgba(248, 250, 252, 0.10)',
    accent: '#818CF8',
    accentSoft: 'rgba(129, 140, 248, 0.16)',
    success: '#22C55E',
    successSoft: 'rgba(34, 197, 94, 0.16)',
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
