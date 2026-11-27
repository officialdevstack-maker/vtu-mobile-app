// src/theme.ts

import { useColorScheme } from 'react-native';

export const brand = {
  petrol: '#12343B',
  mist: '#EEF3F4',
  paper: '#F7F8F3',
  marigold: '#F2B632',
  green: '#1E8E4F',
  coral: '#C8432B',
} as const;

export const palette = {
  light: {
    background: brand.mist,
    surface: brand.paper,
    text: brand.petrol,
    textSecondary: '#4F6A70',
    border: '#D5E0E2',
    primary: brand.marigold,
    onPrimary: brand.petrol,
    success: brand.green,
    danger: brand.coral,
    wallet: brand.petrol,
    onWallet: brand.paper,
    onWalletMuted: '#BCD0D4',
  },
  dark: {
    background: '#0C2227',
    surface: brand.petrol,
    text: brand.mist,
    textSecondary: '#9DB5BA',
    border: '#23505A',
    primary: brand.marigold,
    onPrimary: brand.petrol,
    success: '#3DBE7A',
    danger: '#E8735C',
    wallet: '#17424B',
    onWallet: brand.paper,
    onWalletMuted: '#BCD0D4',
  },
} as const;

export type Palette = (typeof palette)['light'] | (typeof palette)['dark'];

export const radius = 12;
export const MIN_TOUCH = 44;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  balance: 28,
} as const;

export function useColors(): Palette {
  const scheme = useColorScheme();
  return scheme === 'dark' ? palette.dark : palette.light;
}
