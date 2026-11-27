// src/components/summary-row.tsx

import { StyleSheet, Text, View } from 'react-native';

import { fontSize, useColors } from '@/theme';

type SummaryRowProps = {
  label: string;
  value: string;
  strong?: boolean;
  note?: string;
};

export function SummaryRow({ label, value, strong = false, note }: SummaryRowProps) {
  const colors = useColors();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}${note ? `, ${note}` : ''}`}
      style={styles.row}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.valueWrap}>
        <Text style={[strong ? styles.strong : styles.value, { color: colors.text }]}>{value}</Text>
        {note ? <Text style={[styles.note, { color: colors.success }]}>{note}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  label: { fontSize: fontSize.base + 1, lineHeight: 22 },
  valueWrap: { alignItems: 'flex-end', flexShrink: 1 },
  value: { fontSize: fontSize.base + 1, fontWeight: '600', fontVariant: ['tabular-nums'] },
  strong: { fontSize: fontSize.lg, fontWeight: '700', fontVariant: ['tabular-nums'] },
  note: { fontSize: fontSize.sm + 1, lineHeight: 18 },
});
