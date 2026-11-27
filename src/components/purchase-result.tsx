// src/components/purchase-result.tsx

import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import type { PurchaseFlowView } from '@/hooks/use-purchase-flow';
import { fontSize, radius, useColors } from '@/theme';

const RESULT_ICON = {
  success: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  pending: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  failed: { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' },
} as const;

type PurchaseResultCardProps = {
  flow: PurchaseFlowView;
  successTitle: string;
  subject: string;
  onAgain: () => void;
};

export function PurchaseResultCard({
  flow,
  successTitle,
  subject,
  onAgain,
}: PurchaseResultCardProps) {
  const colors = useColors();
  if (!flow.result) return null;

  const status = flow.liveStatus ?? flow.result.status;
  const reference = flow.reference;
  const tint =
    status === 'success' ? colors.success : status === 'failed' ? colors.danger : colors.textSecondary;
  const title =
    status === 'success' ? successTitle : status === 'failed' ? 'Purchase failed' : 'Being confirmed';
  const detail =
    status === 'failed'
      ? `${flow.failureReason ?? 'The purchase could not be completed.'} Any money taken is refunded automatically.`
      : status === 'pending'
        ? flow.pollExpired
          ? 'Still being confirmed. Check History later; it updates on its own.'
          : 'Your money is held while we confirm. This updates on its own.'
        : flow.result.message;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {status === 'pending' && !flow.pollExpired ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <SymbolView tintColor={tint} name={RESULT_ICON[status]} size={44} />
        )}
      </View>
      <Text
        accessibilityRole="header"
        accessibilityLiveRegion="polite"
        style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.subject, { color: colors.text }]}>{subject}</Text>
      <Text style={[styles.detail, { color: colors.textSecondary }]}>{detail}</Text>
      <View style={styles.actions}>
        <Button label="Done" onPress={() => router.back()} />
        {reference ? (
          <Button
            label="View order"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/order/[reference]',
                params: { reference },
              })
            }
          />
        ) : null}
        {status !== 'pending' ? (
          <Button label="Buy again" variant="secondary" onPress={onAgain} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius + 4,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 12,
    alignItems: 'center',
  },
  title: { fontSize: fontSize.xl, fontWeight: '700' },
  subject: {
    fontSize: fontSize.md,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  detail: { fontSize: fontSize.base + 1, lineHeight: 22, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 8 },
});
