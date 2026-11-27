// src/components/amount-tile.tsx

import { Pressable, StyleSheet, Text } from 'react-native';

import { MIN_TOUCH, fontSize, radius, useColors } from '@/theme';

type AmountTileProps = {
  amount: number;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function AmountTile({ amount, selected, onPress, disabled = false }: AmountTileProps) {
  const colors = useColors();
  const label = `₦${amount.toLocaleString('en-NG')}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        selected
          ? { backgroundColor: `${colors.primary}26`, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.amount, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    minHeight: MIN_TOUCH + 20,
    borderRadius: radius,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  amount: { fontSize: fontSize.md, fontWeight: '700', fontVariant: ['tabular-nums'] },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
});
