// src/app/(tabs)/index.tsx

import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBalance, getMe, getTransactions } from '@/api/endpoints';
import { errorMessage, isApiError } from '@/api/errors';
import type { TxStatus } from '@/api/types';
import { useSession } from '@/auth/session';
import { Button } from '@/components/button';
import { OrderRow } from '@/components/order-row';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { SERVICE_ICON } from '@/lib/service-icons';
import { useSlowLoading } from '@/hooks/use-slow-loading';
import { fontSize, useColors } from '@/theme';

const SERVICES = [
  { label: 'Airtime', href: '/buy/airtime', icon: SERVICE_ICON.airtime },
  { label: 'Data', href: '/buy/data', icon: SERVICE_ICON.data },
  { label: 'Cable TV', href: '/buy/cable', icon: SERVICE_ICON.cable },
  { label: 'Electricity', href: '/buy/electricity', icon: SERVICE_ICON.electricity },
  {
    label: 'More',
    href: '/services',
    icon: { ios: 'ellipsis.circle.fill', android: 'more_horiz', web: 'more_horiz' },
  },
] as const;

const PROMOS = [
  {
    title: 'Top up in seconds',
    body: 'Buy airtime for any network straight from your wallet.',
    href: '/buy/airtime',
    icon: SERVICE_ICON.airtime,
    tint: 'primary',
  },
  {
    title: 'Stay online',
    body: 'Pick a data plan and pay from your wallet.',
    href: '/buy/data',
    icon: SERVICE_ICON.data,
    tint: 'success',
  },
  {
    title: 'Never miss a bill',
    body: 'Renew cable TV or buy electricity in a few taps.',
    href: '/buy/electricity',
    icon: SERVICE_ICON.electricity,
    tint: 'text',
  },
] as const;

const STATUS_ICON = {
  success: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  pending: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  failed: { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' },
} as const satisfies Record<TxStatus, { ios: string; android: string; web: string }>;

const CARD_GAP = 10;
const PEEK = 20;

function greeting(): string {
  const hour =
    Number(
      new Intl.DateTimeFormat('en-NG', {
        timeZone: 'Africa/Lagos',
        hour: 'numeric',
        hour12: false,
      }).format(new Date()),
    ) % 24;
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const { isLoading: sessionLoading, isSignedIn, signOut } = useSession();
  const [hidden, setHidden] = useState(false);
  const [promoIndex, setPromoIndex] = useState(0);
  const me = useQuery({ queryKey: ['me'], queryFn: getMe, enabled: isSignedIn });
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
  const recentSlow = useSlowLoading(recent.isLoading);

  if (sessionLoading) {
    return <View style={[styles.fill, { backgroundColor: colors.background }]} />;
  }

  if (isApiError(balance.error) && balance.error.code === 'account_suspended') {
    return (
      <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text accessibilityRole="header" style={[styles.brand, { color: colors.text }]}>
            Account suspended
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{balance.error.message}</Text>
          <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
        </View>
      </SafeAreaView>
    );
  }

  const refreshing = balance.isRefetching || recent.isRefetching || me.isRefetching;
  const items = recent.data?.items ?? [];
  const latest = items[0];
  const pendingCount = items.filter((item) => item.status === 'pending').length;
  const fullName = me.data?.name?.trim() ?? '';
  const firstName = fullName.split(/\s+/)[0] ?? '';
  const initial = (firstName.charAt(0) || 'S').toUpperCase();
  const unread = me.data?.unreadCount ?? 0;
  const unreadText = unread > 9 ? '9+' : String(unread);

  const contentWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const promoWidth = contentWidth - PEEK;

  return (
    <SafeAreaView edges={['top']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void me.refetch();
              void balance.refetch();
              void recent.refetch();
            }}
          />
        }>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={[styles.mark, { backgroundColor: colors.primary }]}>
                <Text style={[styles.markText, { color: colors.onPrimary }]}>{initial}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting()}</Text>
                <Text
                  accessibilityRole="header"
                  numberOfLines={1}
                  style={[styles.brand, { color: colors.text }]}>
                  {firstName ? `Hi, ${firstName}` : 'Welcome'}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Help and support"
                hitSlop={4}
                onPress={() => router.push('/help')}
                style={({ pressed }) => [
                  styles.iconButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}>
                <SymbolView
                  tintColor={colors.text}
                  name={{ ios: 'questionmark.circle', android: 'help', web: 'help' }}
                  size={16}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
                hitSlop={4}
                onPress={() => router.push('/notifications')}
                style={({ pressed }) => [
                  styles.iconButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}>
                <SymbolView
                  tintColor={colors.text}
                  name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
                  size={16}
                />
                {unread > 0 ? (
                  <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                    <Text style={styles.badgeText}>{unreadText}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                hitSlop={4}
                onPress={() => void signOut()}
                style={({ pressed }) => [
                  styles.iconButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}>
                <SymbolView
                  tintColor={colors.text}
                  name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
                  size={16}
                />
              </Pressable>
            </View>
          </View>

          <View style={[styles.walletWrap, { borderColor: colors.border }]}>
            <View style={[styles.wallet, { backgroundColor: colors.wallet }]}>
              <View
                pointerEvents="none"
                style={[styles.shapeLarge, { backgroundColor: colors.onWallet }]}
              />
              <View
                pointerEvents="none"
                style={[styles.shapeSmall, { backgroundColor: colors.onWallet }]}
              />

              <View style={styles.walletTop}>
                <View style={styles.walletTitle}>
                  <SymbolView
                    tintColor={colors.onWalletMuted}
                    name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }}
                    size={18}
                  />
                  <Text style={[styles.walletLabel, { color: colors.onWalletMuted }]}>
                    Wallet balance
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}
                  hitSlop={10}
                  onPress={() => setHidden((value) => !value)}
                  style={styles.eye}>
                  <SymbolView
                    tintColor={colors.onWalletMuted}
                    name={
                      hidden
                        ? { ios: 'eye.slash.fill', android: 'visibility_off', web: 'visibility_off' }
                        : { ios: 'eye.fill', android: 'visibility', web: 'visibility' }
                    }
                    size={16}
                  />
                </Pressable>
              </View>

              {balance.isLoading ? (
                <ActivityIndicator color={colors.onWallet} style={styles.walletSpinner} />
              ) : balance.isError ? (
                <View>
                  <Text accessibilityRole="alert" style={[styles.walletError, { color: colors.onWallet }]}>
                    {errorMessage(balance.error)}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retry wallet balance"
                    onPress={() => void balance.refetch()}
                    style={styles.retryTouch}>
                    <Text style={[styles.retry, { color: colors.onWallet }]}>Try again</Text>
                  </Pressable>
                </View>
              ) : (
                <Text
                  accessibilityLabel={hidden ? 'Balance hidden' : formatNaira(balance.data?.balance ?? 0)}
                  style={[styles.balance, { color: colors.onWallet }]}>
                  {hidden ? '₦ ••••••' : formatNaira(balance.data?.balance ?? 0)}
                </Text>
              )}

              <View style={styles.walletBottom}>
                <Text style={[styles.walletFoot, { color: colors.onWalletMuted }]}>
                  Available to spend
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add money to wallet"
                  hitSlop={6}
                  onPress={() => router.push('/fund')}
                  style={({ pressed }) => [
                    styles.addMoney,
                    { borderColor: colors.onWallet },
                    pressed && styles.pressed,
                  ]}>
                  <SymbolView
                    tintColor={colors.onWallet}
                    name={{ ios: 'plus', android: 'add', web: 'add' }}
                    size={13}
                  />
                  <Text style={[styles.addMoneyText, { color: colors.onWallet }]}>Add Money</Text>
                </Pressable>
              </View>
            </View>

            {latest ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Latest: ${latest.title}. Open all transactions.`}
                onPress={() => router.push('/history')}
                style={({ pressed }) => [
                  styles.strip,
                  { backgroundColor: colors.surface },
                  pressed && styles.pressed,
                ]}>
                <SymbolView
                  tintColor={
                    latest.status === 'success'
                      ? colors.success
                      : latest.status === 'failed'
                        ? colors.danger
                        : colors.textSecondary
                  }
                  name={STATUS_ICON[latest.status]}
                  size={16}
                />
                <Text style={[styles.stripText, { color: colors.text }]} numberOfLines={1}>
                  {latest.title} {latest.direction === 'credit' ? '+' : '-'}
                  {formatNaira(latest.amount)}
                </Text>
                <Text style={[styles.stripLink, { color: colors.textSecondary }]}>Transactions</Text>
                <SymbolView
                  tintColor={colors.textSecondary}
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={10}
                />
              </Pressable>
            ) : null}
          </View>

          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
            Services
          </Text>
          <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {SERVICES.map((service) => (
              <Pressable
                key={service.label}
                accessibilityRole="button"
                accessibilityLabel={service.label === 'More' ? 'More services' : `Buy ${service.label}`}
                onPress={() => router.push(service.href)}
                style={({ pressed }) => [styles.serviceCol, pressed && styles.pressed]}>
                <View style={[styles.serviceIcon, { backgroundColor: colors.primary }]}>
                  <SymbolView tintColor={colors.onPrimary} name={service.icon} size={20} />
                </View>
                <Text style={[styles.serviceLabel, { color: colors.text }]} numberOfLines={1}>
                  {service.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.carouselWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={promoWidth + CARD_GAP}
              snapToAlignment="start"
              decelerationRate="fast"
              scrollEventThrottle={32}
              onScroll={(event) =>
                setPromoIndex(
                  Math.round(event.nativeEvent.contentOffset.x / (promoWidth + CARD_GAP)),
                )
              }
              contentContainerStyle={styles.carousel}>
              {PROMOS.map((promo) => (
                <Pressable
                  key={promo.title}
                  accessibilityRole="button"
                  accessibilityLabel={`${promo.title}. ${promo.body}`}
                  onPress={() => router.push(promo.href)}
                  style={({ pressed }) => [
                    styles.promo,
                    { width: promoWidth, backgroundColor: `${colors[promo.tint]}26` },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.promoText}>
                    <Text style={[styles.promoTitle, { color: colors.text }]}>{promo.title}</Text>
                    <Text style={[styles.promoBody, { color: colors.text }]}>{promo.body}</Text>
                  </View>
                  <View style={[styles.promoIcon, { backgroundColor: colors.surface }]}>
                    <SymbolView tintColor={colors.text} name={promo.icon}                     size={22} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.dots}>
              {PROMOS.map((promo, index) => (
                <View
                  key={promo.title}
                  style={[
                    styles.dot,
                    index === promoIndex
                      ? { width: 18, backgroundColor: colors.text }
                      : { width: 6, backgroundColor: colors.border },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.sectionRow}>
            <View style={styles.sectionLeft}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                Transactions
              </Text>
              {pendingCount > 0 ? (
                <View style={[styles.pendingPill, { backgroundColor: `${colors.primary}33` }]}>
                  <Text style={[styles.pendingText, { color: colors.text }]}>{pendingCount} pending</Text>
                </View>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View all transactions"
              onPress={() => router.push('/history')}
              style={styles.seeAllTouch}>
              <Text style={[styles.seeAll, { color: colors.text }]}>View all</Text>
            </Pressable>
          </View>

          {recent.isLoading ? (
            <LoadingState compact slow={recentSlow} />
          ) : recent.isError ? (
            <ErrorState compact error={recent.error} onRetry={() => void recent.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState compact title="No orders yet" message="Your purchases will show up here." />
          ) : (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {items.slice(0, 5).map((item, index) => (
                <OrderRow key={item.reference} item={item} colors={colors} first={index === 0} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Math.floor((BottomTabInset + Spacing.one) / 2),
  },
  container: { width: '100%', maxWidth: MaxContentWidth, gap: 12 },
  centered: { flex: 1, padding: 16, justifyContent: 'center', gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { flexShrink: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  markText: { fontSize: fontSize.md, fontWeight: '700' },
  greeting: { fontSize: fontSize.sm },
  brand: { fontSize: fontSize.md, fontWeight: '700' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  walletWrap: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  wallet: { padding: 16, overflow: 'hidden', gap: 4 },
  shapeLarge: { position: 'absolute', top: -70, right: -40, width: 190, height: 190, borderRadius: 95, opacity: 0.08 },
  shapeSmall: { position: 'absolute', bottom: -60, right: 80, width: 120, height: 120, borderRadius: 60, opacity: 0.06 },
  walletTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletTitle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  walletLabel: { fontSize: fontSize.sm + 1, fontWeight: '600' },
  eye: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  walletSpinner: { alignSelf: 'flex-start', marginVertical: 6 },
  balance: { fontSize: fontSize.balance, fontWeight: '700', fontVariant: ['tabular-nums'] },
  walletBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  walletFoot: { fontSize: fontSize.sm, flexShrink: 1 },
  addMoney: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 12,
  },
  addMoneyText: { fontSize: fontSize.sm + 1, fontWeight: '700' },
  walletError: { marginBottom: 8 },
  retryTouch: { minHeight: 44, justifyContent: 'center' },
  retry: { fontWeight: '700', textDecorationLine: 'underline' },

  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  stripText: { flex: 1, fontSize: fontSize.sm + 1, fontWeight: '600', fontVariant: ['tabular-nums'] },
  stripLink: { fontSize: fontSize.sm },

  panel: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  serviceCol: { flex: 1, minHeight: 72, alignItems: 'center', gap: 6 },
  serviceIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  serviceLabel: { fontSize: fontSize.sm, fontWeight: '600' },

  carouselWrap: { gap: 8 },
  carousel: { gap: CARD_GAP },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 80,
    borderRadius: 14,
    padding: 12,
  },
  promoText: { flex: 1, gap: 2 },
  promoTitle: { fontSize: fontSize.base + 1, fontWeight: '700' },
  promoBody: { fontSize: fontSize.sm, lineHeight: 17 },
  promoIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700' },
  pendingPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  pendingText: { fontSize: fontSize.xs, fontWeight: '700' },
  seeAllTouch: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  seeAll: { fontSize: fontSize.sm + 1, fontWeight: '700' },

  pressed: { opacity: 0.85 },
  body: { fontSize: fontSize.base, lineHeight: 20, textAlign: 'center' },
  gap: { gap: 10 },
  error: { fontSize: fontSize.base, fontWeight: '600' },
  card: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  empty: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8, alignItems: 'center' },
});
