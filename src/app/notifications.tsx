// src/app/notifications.tsx

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getNotifications, markNotificationsRead } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { MaxContentWidth } from '@/constants/theme';
import { formatLagosDate } from '@/lib/format';
import { radius, useColors } from '@/theme';

export default function NotificationsScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['notifications'], queryFn: getNotifications, staleTime: 0 });
  const markRead = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const items = query.data?.items ?? [];
  const hasUnread = items.some((item) => !item.read);

  useEffect(() => {
    if (hasUnread && !markRead.isPending && !markRead.isSuccess) markRead.mutate();
  }, [hasUnread, markRead]);

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
      No notifications yet.
    </Text>
  );

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={empty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />
        }
        renderItem={({ item }) => (
          <View
            accessible
            accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}. ${formatLagosDate(item.at)}`}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.titleRow}>
              {item.read ? null : <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            </View>
            <Text style={[styles.body, styles.left, { color: colors.text }]}>{item.body}</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{formatLagosDate(item.at)}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  list: { width: '100%', maxWidth: MaxContentWidth },
  listContent: { padding: 16 },
  separator: { height: 12 },
  state: { paddingVertical: 24 },
  gap: { gap: 12 },
  card: { borderRadius: radius, borderWidth: 1, padding: 16, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  left: { textAlign: 'left' },
  meta: { fontSize: 12 },
  error: { fontSize: 14, fontWeight: '600' },
});
