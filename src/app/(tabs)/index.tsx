import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBalance, getTransactions } from '@/api/endpoints';
import { errorMessage, isApiError } from '@/api/errors';
import { useSession } from '@/auth/session';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatLagosDate, formatNaira } from '@/lib/format';
import { radius, useColors, type Palette } from '@/theme';
import { Button } from '@/components/button';
import type { TransactionItem } from '@/api/types';

export default function HomeScreen() {
  const colors = useColors();
  const { isLoading: sessionLoading, isSignedIn, signOut } = useSession();
  const balance = useQuery({
    queryKey: ['balance'],
    queryFn: getBalance,
    enabled: isSignedIn,
  });
  const recent = useQuery({
    queryKey: ['transactions', { page: 1 }],
    queryFn: () => getTransactions({ page: 1 }),
    enabled: isSignedIn,
  });

  if (sessionLoading) return <View style={styles.center} />;

  if (isApiError(balance.error) && balance.error.code === 'account_suspended') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text accessibilityRole="header" style={[styles.brand, { color: colors.text }]}>Account suspended</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{balance.error.message}</Text>
          <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
        </View>
      </SafeAreaView>
    );
  }

  const refreshing = balance.isRefetching || recent.isRefetching;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void balance.refetch();
              void recent.refetch();
            }}
          />
        }>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good day</Text>
            <Text style={[styles.brand, { color: colors.text }]}>Spur VTU</Text>
          </View>
          <Pressable
            accessibilityLabel="Sign out"
            onPress={() => void signOut()}
            style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
            <Text style={[styles.signOutText, { color: colors.text }]}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.wallet}>
          <Text style={styles.walletLabel}>Wallet balance</Text>
          {balance.isLoading ? (
            <ActivityIndicator color="#F2B632" />
          ) : balance.isError ? (
            <View>
              <Text style={styles.error}>{errorMessage(balance.error)}</Text>
              <Pressable accessibilityLabel="Retry wallet balance" onPress={() => void balance.refetch()}>
                <Text style={styles.retry}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.balance}>{formatNaira(balance.data?.balance ?? 0)}</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.services}>
          {['Airtime', 'Data', 'Cable TV', 'Electricity'].map((service) => (
            <Pressable
              accessibilityLabel={`Buy ${service}`}
              key={service}
              style={({ pressed }) => [styles.service, pressed && styles.pressed]}>
              <Text style={styles.serviceText}>{service}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent orders</Text>
        {recent.isLoading ? (
          <Text style={[styles.body, { color: colors.textSecondary }]}>Loading…</Text>
        ) : recent.isError ? (
          <View style={styles.gap}>
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
              {errorMessage(recent.error)}
            </Text>
            <Button label="Retry" variant="secondary" onPress={() => void recent.refetch()} />
          </View>
        ) : !recent.data || recent.data.items.length === 0 ? (
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            No orders yet. Your purchases will show up here.
          </Text>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {recent.data.items.slice(0, 5).map((item, index) => (
              <OrderRow key={item.reference} item={item} colors={colors} first={index === 0} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const STATUS_LABEL: Record<TransactionItem['status'], string> = {
  success: 'Successful',
  pending: 'Being confirmed',
  failed: 'Failed',
};

function OrderRow({
  item,
  colors,
  first,
}: {
  item: TransactionItem;
  colors: Palette;
  first: boolean;
}) {
  const statusColor =
    item.status === 'success'
      ? colors.success
      : item.status === 'failed'
        ? colors.danger
        : colors.textSecondary;
  const sign = item.direction === 'credit' ? '+' : '-';

  return (
    <View
      accessible
      accessibilityLabel={`${item.title}, ${STATUS_LABEL[item.status]}, ${sign}${formatNaira(item.amount)}`}
      style={[
        styles.row,
        !first && {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
      ]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
          {formatLagosDate(item.at)}
        </Text>
      </View>
      <View style={styles.rowAmount}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>
          {sign}
          {formatNaira(item.amount)}
        </Text>
        <Text style={[styles.rowMeta, { color: statusColor }]}>
          {STATUS_LABEL[item.status]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: 20,
    paddingVertical: 24,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF3F4',
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.three,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF3F4' },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { color: '#60757A', fontSize: 14 },
  brand: { color: '#12343B', fontSize: 24, fontWeight: '700', marginTop: 2 },
  signOut: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 },
  signOutText: { color: '#12343B', fontWeight: '700' },
  wallet: { width: '100%', minHeight: 140, justifyContent: 'center', borderRadius: 16, backgroundColor: '#12343B', padding: 24 },
  walletLabel: { color: '#BCD0D4', fontSize: 14, marginBottom: 8 },
  balance: { color: '#F7F8F3', fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  error: { color: '#C8432B', marginBottom: 8 },
  retry: { color: '#F2B632', minHeight: 44, fontWeight: '700' },
  sectionTitle: { color: '#12343B', fontSize: 20, fontWeight: '700' },
  services: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  service: { width: '48%', minHeight: 88, flexGrow: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F7F8F3' },
  serviceText: { color: '#12343B', fontWeight: '700' },
  pressed: { opacity: 0.85 },
  body: { fontSize: 15, lineHeight: 22 },
  gap: { gap: 12 },
  card: { borderRadius: radius, borderWidth: 1, padding: 16, gap: 8 },
  centered: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowText: { flex: 1, gap: 2 },
  rowAmount: { alignItems: 'flex-end', gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  rowMeta: { fontSize: 13 },
});
