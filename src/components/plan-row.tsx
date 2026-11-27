// src/components/plan-row.tsx

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatNaira } from '@/lib/format';
import { MIN_TOUCH, fontSize, radius, useColors } from '@/theme';

type PlanRowProps = {
  name: string;
  validity: string;
  price: number;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function PlanRow({ name, validity, price, selected, onPress, disabled = false }: PlanRowProps) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${validity}, ${formatNaira(price)}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected
          ? { backgroundColor: `${colors.primary}26`, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <View style={styles.text}>
        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.validity, { color: colors.textSecondary }]}>{validity}</Text>
      </View>
      <Text style={[styles.price, { color: colors.text }]}>{formatNaira(price)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH + 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: radius,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  text: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.md, fontWeight: '700' },
  validity: { fontSize: fontSize.sm },
  price: { fontSize: fontSize.base + 1, fontWeight: '700', fontVariant: ['tabular-nums'] },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
});
