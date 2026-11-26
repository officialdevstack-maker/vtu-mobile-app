/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#12343B',
    background: '#EEF3F4',
    backgroundElement: '#F7F8F3',
    backgroundSelected: '#E2EAEB',
    textSecondary: '#60757A',
    petrol: '#12343B',
    mist: '#EEF3F4',
    paper: '#F7F8F3',
    marigold: '#F2B632',
    green: '#1E8E4F',
    coral: '#C8432B',
  },
  dark: {
    text: '#F7F8F3',
    background: '#10282E',
    backgroundElement: '#12343B',
    backgroundSelected: '#1B454E',
    textSecondary: '#BCD0D4',
    petrol: '#12343B',
    mist: '#EEF3F4',
    paper: '#F7F8F3',
    marigold: '#F2B632',
    green: '#4DB56F',
    coral: '#E66B55',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
