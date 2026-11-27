// src/components/menu-row.tsx

import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontSize, useColors } from '@/theme';

export type MenuTone = 'primary' | 'success' | 'neutral' | 'danger';

type MenuRowProps = {
  label: string;
  onPress: () => void;
  icon: ComponentProps<typeof SymbolView>['name'];
  subtitle?: string;
  value?: string;
  tone?: MenuTone;
  danger?: boolean;
  first?: boolean;
  accessibilityLabel?: string;
};

export function MenuRow({
  label,
  onPress,
  icon,
  subtitle,
  value,
  tone = 'primary',
  danger = false,
  first = false,
  accessibilityLabel,
}: MenuRowProps) {
  const colors = useColors();
  const resolved: MenuTone = danger ? 'danger' : tone;

  const tile = {
    primary: { bg: colors.primary, fg: colors.onPrimary },
    success: { bg: `${colors.success}26`, fg: colors.success },
    neutral: { bg: colors.background, fg: colors.text },
    danger: { bg: `${colors.danger}1F`, fg: colors.danger },
  }[resolved];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (value ? `${label}, ${value}` : label)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !first && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.icon, { backgroundColor: tile.bg }]}>
        <SymbolView tintColor={tile.fg} name={icon} size={16} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.label, { color: danger ? colors.danger : colors.text }]}>{label}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={[styles.value, { color: colors.textSecondary }]}>{value}</Text> : null}
      <SymbolView
        tintColor={colors.textSecondary}
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={11}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingVertical: 8 },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 1 },
  label: { fontSize: fontSize.base, fontWeight: '600' },
  subtitle: { fontSize: fontSize.sm, lineHeight: 16 },
  value: { fontSize: fontSize.sm, fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.85 },
});
