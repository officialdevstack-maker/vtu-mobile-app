import { SymbolView } from 'expo-symbols';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { fontSize, useColors } from '@/theme';

export type StateTone = 'neutral' | 'danger' | 'success';

export type StateViewProps = {
  icon: ComponentProps<typeof SymbolView>['name'];
  title: string;
  message?: string;
  tone?: StateTone;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  compact?: boolean;
  alert?: boolean;
  children?: ReactNode;
};

export function StateView({
  icon,
  title,
  message,
  tone = 'neutral',
  actionLabel,
  onAction,
  actionLoading = false,
  secondaryLabel,
  onSecondary,
  compact = false,
  alert = false,
  children,
}: StateViewProps) {
  const colors = useColors();
  const tint =
    tone === 'danger' ? colors.danger : tone === 'success' ? colors.success : colors.textSecondary;

  return (
    <View style={[styles.wrap, compact ? styles.compact : styles.full]}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[styles.iconWrap, { backgroundColor: `${tint}1F` }]}>
        <SymbolView tintColor={tint} name={icon} size={compact ? 28 : 36} />
      </View>
      <Text
        accessibilityRole={alert ? 'alert' : 'header'}
        accessibilityLiveRegion="polite"
        style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      ) : null}
      {children}
      {actionLabel && onAction ? (
        <View style={styles.actions}>
          <Button label={actionLabel} onPress={onAction} loading={actionLoading} />
          {secondaryLabel && onSecondary ? (
            <Button label={secondaryLabel} variant="secondary" onPress={onSecondary} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, alignSelf: 'stretch' },
  full: { paddingVertical: 40, paddingHorizontal: 16 },
  compact: { paddingVertical: 20, paddingHorizontal: 12 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: fontSize.base + 1, lineHeight: 22, textAlign: 'center', maxWidth: 320 },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 10 },
});
