// src/components/plan-tile.tsx

import { Pressable, StyleSheet, Text } from 'react-native';

import { formatNaira } from '@/lib/format';
import { MIN_TOUCH, fontSize, radius, useColors } from '@/theme';

type PlanTileProps = {
  size: string;
  validity: string;
  price: number;
  selected: boolean;
  onPress: () => void;
};

export function PlanTile({ size, validity, price, selected, onPress }: PlanTileProps) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${size}, ${validity}, ${formatNaira(price)}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        selected
          ? { backgroundColor: `${colors.primary}26`, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.size, { color: colors.text }]}>{size}</Text>
      <Text style={[styles.validity, { color: colors.textSecondary }]}>{validity}</Text>
      <Text style={[styles.price, { color: colors.text }]}>{formatNaira(price)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    minHeight: MIN_TOUCH + 44,
    borderRadius: radius,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  size: { fontSize: fontSize.lg, fontWeight: '700' },
  validity: { fontSize: fontSize.sm },
  price: { fontSize: fontSize.base + 1, fontWeight: '700', fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.85 },
});
