import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getNotifications, markNotificationsRead } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import type { AppNotification, NotificationList } from '@/api/types';
import { Button } from '@/components/button';
import { FilterChip } from '@/components/filter-chip';
import { MaxContentWidth } from '@/constants/theme';
import { groupByDay, type DaySection } from '@/lib/group-by-day';
import { fontSize, MIN_TOUCH, radius, useColors } from '@/theme';

type Filter = 'all' | 'unread';
type MarkReadContext = { previous: NotificationList | undefined };

const timeFormatter = new Intl.DateTimeFormat('en-NG', {
  timeZone: 'Africa/Lagos',
  hour: 'numeric',
  minute: '2-digit',
});

export default function NotificationsScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');
  const query = useQuery({ queryKey: ['notifications'], queryFn: getNotifications, staleTime: 0 });

  const markRead = useMutation<Awaited<ReturnType<typeof markNotificationsRead>>, Error, void, MarkReadContext>({
    mutationFn: markNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<NotificationList>(['notifications']);
      if (previous) {
        queryClient.setQueryData<NotificationList>(['notifications'], {
          items: previous.items.map((item) => ({ ...item, read: true })),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const items = query.data?.items;
  const unreadCount = items?.filter((item) => !item.read).length ?? 0;
  const sections = useMemo(() => {
    const list = items ?? [];
    return groupByDay(filter === 'unread' ? list.filter((item) => !item.read) : list);
  }, [items, filter]);
  const markDisabled = unreadCount === 0 || markRead.isPending;

  const header = (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.chips}>
          <FilterChip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip
            label={unreadCount > 0 ? `Unread (${unreadCount})` : 'Unread'}
            selected={filter === 'unread'}
            onPress={() => setFilter('unread')}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
          accessibilityState={{ disabled: markDisabled }}
          disabled={markDisabled}
          onPress={() => markRead.mutate()}
          style={({ pressed }) => [
            styles.markAll,
            markDisabled && styles.inactive,
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.markAllText, { color: colors.text }]}>
            {markRead.isPending ? 'Marking as read…' : 'Mark all as read'}
          </Text>
        </Pressable>
      </View>
      {markRead.isError ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {errorMessage(markRead.error)}
        </Text>
      ) : null}
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
      {filter === 'unread' ? 'You are all caught up.' : 'No notifications yet.'}
    </Text>
  );

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <SectionList<AppNotification, DaySection<AppNotification>>
        style={styles.list}
        contentContainerStyle={styles.listContent}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={NotificationSeparator}
        renderSectionHeader={({ section }) => (
          <Text accessibilityRole="header" style={[styles.day, { color: colors.text }]}>
            {section.title}
          </Text>
        )}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />
        }
        renderItem={({ item }) => {
          const time = timeFormatter.format(new Date(item.at));
          return (
            <View
              accessible
              accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}. ${time}`}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {item.read ? null : (
                <View style={[styles.unreadDot, { backgroundColor: colors.danger }]} />
              )}
              <View style={[styles.icon, { backgroundColor: colors.background }]}>
                <SymbolView
                  tintColor={colors.text}
                  name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
                  size={18}
                />
              </View>
              <View style={styles.cardText}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.time, { color: colors.textSecondary }]}>{time}</Text>
                </View>
                <Text style={[styles.body, { color: colors.textSecondary }]}>{item.body}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function NotificationSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  list: { width: '100%', maxWidth: MaxContentWidth },
  listContent: { padding: 16 },
  header: { gap: 8, paddingBottom: 4 },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chips: { flexDirection: 'row', gap: 8, flexShrink: 1 },
  markAll: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 4 },
  markAllText: { fontSize: fontSize.base, fontWeight: '700', textDecorationLine: 'underline' },
  inactive: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
  day: { fontSize: fontSize.md, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  separator: { height: 10 },
  state: { paddingVertical: 24 },
  gap: { gap: 12 },
  card: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: radius + 4,
    borderWidth: 1,
    padding: 14,
  },
  unreadDot: { position: 'absolute', top: 8, left: 8, width: 8, height: 8, borderRadius: 4, zIndex: 1 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: fontSize.md, fontWeight: '700' },
  time: { fontSize: fontSize.sm + 1, fontVariant: ['tabular-nums'] },
  body: { fontSize: fontSize.base + 1, lineHeight: 21 },
  error: { fontSize: fontSize.base, fontWeight: '600' },
});
