import { Pressable, StyleSheet, Text } from 'react-native';

import { fontSize, useColors } from '@/theme';

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Filter: ${label}`}
      accessibilityState={{ selected }}
      hitSlop={{ top: 6, bottom: 6 }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, { color: selected ? colors.onPrimary : colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: fontSize.sm + 1, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
