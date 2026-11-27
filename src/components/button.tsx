// src/components/button.tsx

import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { MIN_TOUCH, fontSize, radius, useColors } from '@/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  accessibilityLabel,
}: ButtonProps) {
  const colors = useColors();
  const inactive = disabled || loading;
  const primary = variant === 'primary';
  const textColor = primary ? colors.onPrimary : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary
          ? { backgroundColor: colors.primary }
          : { borderColor: colors.border, borderWidth: 1.5 },
        inactive && styles.inactive,
        pressed && styles.pressed,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH,
    borderRadius: radius,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: fontSize.base + 1, fontWeight: '700' },
  inactive: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
});
