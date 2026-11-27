import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import type { TransactionItem } from '@/api/types';
import { formatLagosDate, formatNaira } from '@/lib/format';
import { SERVICE_ICON } from '@/lib/service-icons';
import type { Palette } from '@/theme';

export const STATUS_LABEL: Record<TransactionItem['status'], string> = {
  success: 'Successful',
  pending: 'Being confirmed',
  failed: 'Failed',
};

type OrderRowProps = {
  item: TransactionItem;
  colors: Palette;
  first: boolean;
};

export function OrderRow({ item, colors, first }: OrderRowProps) {
  const statusColor =
    item.status === 'success'
      ? colors.success
      : item.status === 'failed'
        ? colors.danger
        : colors.textSecondary;
  const credit = item.direction === 'credit';
  const sign = credit ? '+' : '-';

  return (
    <View
      accessible
      accessibilityLabel={`${item.title}, ${STATUS_LABEL[item.status]}, ${sign}${formatNaira(item.amount)}`}
      style={[
        styles.row,
        !first && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
      ]}>
      <View style={[styles.icon, { backgroundColor: colors.background }]}>
        <SymbolView
          tintColor={credit ? colors.success : colors.text}
          name={SERVICE_ICON[item.service]}
          size={18}
        />
      </View>

      <View style={styles.rowText}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {formatLagosDate(item.at)}
        </Text>
      </View>
      <View style={styles.rowAmount}>
        <Text style={[styles.title, { color: credit ? colors.success : colors.text }]}>
          {sign}
          {formatNaira(item.amount)}
        </Text>
        <View style={[styles.pill, { backgroundColor: `${statusColor}1F` }]}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.pillText, { color: statusColor }]}>{STATUS_LABEL[item.status]}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowAmount: { alignItems: 'flex-end', gap: 4 },
  title: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  meta: { fontSize: 13 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '700' },
});
