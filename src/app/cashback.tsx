// src/app/cashback.tsx

import { useQuery } from '@tanstack/react-query';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCashback, type CashbackEntry } from '@/api/account';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { MaxContentWidth } from '@/constants/theme';
import { formatLagosDate, formatNaira } from '@/lib/format';
import { useSlowLoading } from '@/hooks/use-slow-loading';
import { radius, useColors } from '@/theme';

function entryTitle(entry: CashbackEntry): string {
  const service = entry.service ? ` on ${entry.service}` : '';
  return entry.direction === 'credit' ? `Cashback earned${service}` : `Cashback used${service}`;
}

export default function CashbackScreen() {
  const colors = useColors();
  const query = useQuery({ queryKey: ['cashback'], queryFn: getCashback });
  const slow = useSlowLoading(query.isLoading);
  const data = query.data;
  const header = data ? (
    <View style={styles.header}>
      <View style={[styles.balanceCard, { backgroundColor: colors.wallet }]}>
        <Text style={[styles.balanceLabel, { color: colors.onWalletMuted }]}>Cashback balance</Text>
        <Text style={[styles.balance, { color: colors.onWallet }]}>{formatNaira(data.balance)}</Text>
      </View>
      {data.settings.enabled ? null : <Text style={[styles.note, { color: colors.textSecondary }]}>Cashback is not active right now.</Text>}
      <Text accessibilityRole="header" style={[styles.section, { color: colors.text }]}>History</Text>
    </View>
  ) : undefined;
  const empty = query.isLoading ? (
    <LoadingState slow={slow} />
  ) : query.isError ? (
    <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  ) : (
    <EmptyState title="No cashback yet" message="Cashback you earn on purchases will show up here." />
  );

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={data?.history ?? []}
        keyExtractor={(item) => item.reference}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
        renderItem={({ item }) => {
          const credit = item.direction === 'credit';
          return (
            <View accessible accessibilityLabel={`${entryTitle(item)}, ${credit ? 'plus' : 'minus'} ${formatNaira(item.amount)}, ${formatLagosDate(item.at)}`} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{entryTitle(item)}</Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatLagosDate(item.at)}</Text>
              </View>
              <Text style={[styles.rowTitle, { color: credit ? colors.success : colors.text }]}>{credit ? '+' : '-'}{formatNaira(item.amount)}</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  list: { width: '100%', maxWidth: MaxContentWidth },
  listContent: { padding: 16 },
  header: { gap: 10, paddingBottom: 10 },
  balanceCard: { borderRadius: 20, padding: 16, gap: 6 },
  balanceLabel: { fontSize: 14, fontWeight: '600' },
  balance: { fontSize: 36, fontWeight: '700', fontVariant: ['tabular-nums'] },
  section: { fontSize: 18, fontWeight: '700' },
  separator: { height: 10 },
  state: { paddingVertical: 16 },
  gap: { gap: 10 },
  center: { textAlign: 'center' },
  note: { fontSize: 14, lineHeight: 20 },
  error: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: radius, borderWidth: 1, padding: 12 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  meta: { fontSize: 12 },
});
