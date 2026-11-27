import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTransactions } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import type { TransactionFilters, TransactionItem, TxService, TxStatus } from '@/api/types';
import { Button } from '@/components/button';
import { FilterChip } from '@/components/filter-chip';
import { OrderRow } from '@/components/order-row';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { groupByDay } from '@/lib/group-by-day';
import { fontSize, MIN_TOUCH, radius, useColors } from '@/theme';

type StatusFilter = TxStatus | 'all';
type ServiceFilter = TxService | 'all';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'success', label: 'Successful' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
];

const SERVICE_OPTIONS: { value: ServiceFilter; label: string }[] = [
  { value: 'all', label: 'All services' },
  { value: 'airtime', label: 'Airtime' },
  { value: 'data', label: 'Data' },
  { value: 'cable', label: 'Cable TV' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'wallet', label: 'Wallet' },
];

export default function HistoryScreen() {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [service, setService] = useState<ServiceFilter>('all');

  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const filters: TransactionFilters = { q, status, service };
  const query = useInfiniteQuery({
    queryKey: ['transactions', filters],
    queryFn: ({ pageParam }) => getTransactions({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
  });

  const pages = query.data?.pages;
  const sections = useMemo(() => {
    const uniqueItems = new Map<string, TransactionItem>();
    for (const page of pages ?? []) {
      for (const item of page.items) {
        if (!uniqueItems.has(item.reference)) uniqueItems.set(item.reference, item);
      }
    }
    return groupByDay(Array.from(uniqueItems.values()));
  }, [pages]);

  const header = (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        History
      </Text>
      <TextInput
        accessibilityLabel="Search orders"
        value={search}
        onChangeText={setSearch}
        placeholder="Search orders"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        maxLength={100}
        style={[
          styles.search,
          { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {STATUS_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={status === option.value}
            onPress={() => setStatus(option.value)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {SERVICE_OPTIONS.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            selected={service === option.value}
            onPress={() => setService(option.value)}
          />
        ))}
      </ScrollView>
    </View>
  );

  const empty = query.isLoading ? (
    <ActivityIndicator color={colors.text} style={styles.state} />
  ) : query.isError ? (
    <View style={[styles.state, styles.gap]}>
      <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
        {errorMessage(query.error)}
      </Text>
      <Button label="Retry" variant="secondary" onPress={() => void query.refetch()} />
    </View>
  ) : (
    <Text style={[styles.body, styles.state, { color: colors.textSecondary }]}>
      {q || status !== 'all' || service !== 'all'
        ? 'No orders match these filters.'
        : 'No orders yet. Your purchases will show up here.'}
    </Text>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <SectionList<TransactionItem, { title: string; data: TransactionItem[] }>
        style={styles.list}
        contentContainerStyle={styles.listContent}
        sections={sections}
        keyExtractor={(item) => item.reference}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        renderSectionHeader={({ section }) => (
          <Text accessibilityRole="header" style={[styles.day, { color: colors.textSecondary }]}>
            {section.title}
          </Text>
        )}
        renderItem={({ item, index, section }) => (
          <View
            style={[
              styles.rowWrap,
              { backgroundColor: colors.surface, borderColor: colors.border },
              index === 0 && styles.rowFirst,
              index === section.data.length - 1 && styles.rowLast,
            ]}>
            <OrderRow item={item} colors={colors} first={index === 0} timeOnly />
          </View>
        )}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color={colors.text} style={styles.state} />
          ) : query.isFetchNextPageError ? (
            <View style={[styles.state, styles.gap]}>
              <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
                {errorMessage(query.error)}
              </Text>
              <Button
                label="Load more"
                variant="secondary"
                onPress={() => void query.fetchNextPage()}
              />
            </View>
          ) : undefined
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  list: { width: '100%', maxWidth: MaxContentWidth },
  listContent: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  header: { gap: 12, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '700' },
  search: {
    minHeight: MIN_TOUCH,
    borderRadius: radius,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  chips: { gap: 8, paddingRight: 8 },
  day: { fontSize: fontSize.base, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  rowWrap: { borderLeftWidth: 1, borderRightWidth: 1, paddingHorizontal: 16 },
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: radius, borderTopRightRadius: radius },
  rowLast: { borderBottomWidth: 1, borderBottomLeftRadius: radius, borderBottomRightRadius: radius },
  state: { paddingVertical: 24 },
  gap: { gap: 12 },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  error: { fontSize: 14, fontWeight: '600' },
});
