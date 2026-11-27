// src/app/(tabs)/me.tsx

import { useMutation, useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestAccountDeletion } from '@/api/account';
import { getMe } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { useSession } from '@/auth/session';
import { Button } from '@/components/button';
import { MenuRow } from '@/components/menu-row';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { SERVICE_ICON } from '@/lib/service-icons';
import { fontSize, useColors } from '@/theme';

const QUICK = [
  {
    label: 'Transactions',
    href: '/history',
    icon: { ios: 'list.bullet.rectangle.fill', android: 'receipt_long', web: 'receipt_long' },
  },
  { label: 'Add money', href: '/fund', icon: SERVICE_ICON.wallet },
  {
    label: 'Security',
    href: '/pin',
    icon: { ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' },
  },
] as const;

export default function MeScreen() {
  const colors = useColors();
  const { isSignedIn, isMockMode, signOut } = useSession();
  const [hidden, setHidden] = useState(false);
  const me = useQuery({ queryKey: ['me'], queryFn: getMe, enabled: isSignedIn });
  const deletion = useMutation({
    mutationFn: requestAccountDeletion,
    onSuccess: () => void signOut(),
  });

  const profile = me.data;
  const initial = (profile?.name?.trim().charAt(0) || 'S').toUpperCase();
  const contact = profile?.email ?? profile?.phone ?? (profile ? `@${profile.username}` : '');
  const version = Constants.expoConfig?.version ?? '';

  function confirmDelete() {
    Alert.alert(
      'Delete your account?',
      'Your account will be suspended and queued for deletion. You will be signed out and will not be able to make purchases.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: () => deletion.mutate() },
      ],
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={me.isRefetching} onRefresh={() => void me.refetch()} />
        }>
        <View style={styles.content}>
          {me.isLoading ? (
            <ActivityIndicator color={colors.text} style={styles.state} />
          ) : me.isError || !profile ? (
            <View style={styles.gap}>
              <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
                {errorMessage(me.error)}
              </Text>
              <Button label="Retry" variant="secondary" onPress={() => void me.refetch()} />
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.identity,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={styles.identityTop}>
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{initial}</Text>
                  </View>
                  <View style={styles.pills}>
                    <View style={[styles.pill, { backgroundColor: `${colors.primary}33` }]}>
                      <Text style={[styles.pillText, { color: colors.text }]}>
                        {profile.package.name} package
                      </Text>
                    </View>
                    {profile.verified ? (
                      <View style={[styles.pill, { backgroundColor: `${colors.success}1F` }]}>
                        <SymbolView
                          tintColor={colors.success}
                          name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                          size={11}
                        />
                        <Text style={[styles.pillText, { color: colors.success }]}>Verified</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Text
                  accessibilityRole="header"
                  numberOfLines={2}
                  style={[styles.name, { color: colors.text }]}>
                  {profile.name.toUpperCase()}
                </Text>
                <Text style={[styles.contact, { color: colors.textSecondary }]} numberOfLines={1}>
                  {contact}
                </Text>
              </View>

              <View
                style={[
                  styles.balanceCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                <View style={styles.balanceRow}>
                  <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                    Wallet balance
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={hidden ? 'Show balance' : 'Hide balance'}
                    hitSlop={10}
                    onPress={() => setHidden((value) => !value)}>
                    <SymbolView
                      tintColor={colors.textSecondary}
                      name={
                        hidden
                          ? { ios: 'eye.slash.fill', android: 'visibility_off', web: 'visibility_off' }
                          : { ios: 'eye.fill', android: 'visibility', web: 'visibility' }
                      }
                      size={15}
                    />
                  </Pressable>
                  <Text
                    accessibilityLabel={
                      hidden ? 'Balance hidden' : formatNaira(profile.walletBalance)
                    }
                    style={[styles.balanceValue, { color: colors.text }]}>
                    {hidden ? '₦ ••••' : formatNaira(profile.walletBalance)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Cashback ${formatNaira(profile.cashbackBalance)}. Open cashback.`}
                  onPress={() => router.push('/cashback')}
                  style={({ pressed }) => [
                    styles.cashbackRow,
                    { borderTopColor: colors.border },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Cashback</Text>
                  <Text style={[styles.cashbackValue, { color: colors.success }]}>
                    {hidden ? '₦ ••••' : formatNaira(profile.cashbackBalance)}
                  </Text>
                  <SymbolView
                    tintColor={colors.textSecondary}
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    size={11}
                  />
                </Pressable>
              </View>

              {profile.hasPin ? null : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Set your transaction PIN. You need it to buy."
                  onPress={() => router.push('/pin')}
                  style={({ pressed }) => [
                    styles.nudge,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.nudgeBar, { backgroundColor: colors.primary }]} />
                  <SymbolView
                    tintColor={colors.text}
                    name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                    size={16}
                  />
                  <Text style={[styles.nudgeText, { color: colors.text }]}>
                    Set your transaction PIN to start buying
                  </Text>
                  <SymbolView
                    tintColor={colors.textSecondary}
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    size={11}
                  />
                </Pressable>
              )}

              <View
                style={[
                  styles.quick,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}>
                {QUICK.map((item) => (
                  <Pressable
                    key={item.label}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    onPress={() => router.push(item.href)}
                    style={({ pressed }) => [styles.quickCol, pressed && styles.pressed]}>
                    <View style={[styles.quickIcon, { backgroundColor: colors.primary }]}>
                      <SymbolView tintColor={colors.onPrimary} name={item.icon} size={18} />
                    </View>
                    <Text style={[styles.quickLabel, { color: colors.text }]} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MenuRow
                  first
                  tone="danger"
                  label="Get help"
                  subtitle="Get support or send feedback"
                  icon={{ ios: 'headphones', android: 'support_agent', web: 'support_agent' }}
                  onPress={() => router.push('/help')}
                />
              </View>

              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MenuRow
                  first
                  label="Cashback"
                  subtitle="See how much you've earned"
                  icon={{ ios: 'gift.fill', android: 'redeem', web: 'redeem' }}
                  onPress={() => router.push('/cashback')}
                />
                <MenuRow
                  label="Referrals"
                  subtitle="Get paid when your friends join"
                  icon={{ ios: 'person.2.fill', android: 'group', web: 'group' }}
                  onPress={() => router.push('/referrals')}
                />
                <MenuRow
                  label="Notifications"
                  subtitle="Updates on your orders and wallet"
                  value={profile.unreadCount > 0 ? `${profile.unreadCount} new` : undefined}
                  icon={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
                  onPress={() => router.push('/notifications')}
                />
              </View>

              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MenuRow
                  first
                  tone="success"
                  label="Transaction PIN"
                  subtitle={profile.hasPin ? 'Change or reset your PIN' : 'Set a PIN to confirm purchases'}
                  value={profile.hasPin ? 'Set' : 'Not set'}
                  icon={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                  onPress={() => router.push('/pin')}
                />
              </View>
            </>
          )}

          {deletion.isError ? (
            <Text accessibilityRole="alert" style={[styles.error, styles.center, { color: colors.danger }]}>
              {errorMessage(deletion.error)}
            </Text>
          ) : null}

          {isMockMode ? null : (
            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                onPress={() => void signOut()}
                style={({ pressed }) => [styles.footerTouch, pressed && styles.pressed]}>
                <Text style={[styles.signOut, { color: colors.danger }]}>Sign out</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete account"
                onPress={confirmDelete}
                style={({ pressed }) => [styles.footerTouch, pressed && styles.pressed]}>
                <Text style={[styles.deleteText, { color: colors.textSecondary }]}>
                  Delete account
                </Text>
              </Pressable>
            </View>
          )}

          {version ? (
            <Text style={[styles.version, { color: colors.textSecondary }]}>Spur VTU v{version}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Math.floor((BottomTabInset + Spacing.one) / 2),
  },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: 12 },
  state: { paddingVertical: 24 },
  gap: { gap: 10 },
  center: { textAlign: 'center' },
  error: { fontSize: fontSize.base, fontWeight: '600' },
  pressed: { opacity: 0.85 },
  card: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },

  identity: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  identityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSize.xl, fontWeight: '700' },
  pills: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  pillText: { fontSize: fontSize.xs + 1, fontWeight: '700' },
  name: { fontSize: fontSize.xl, fontWeight: '800', lineHeight: 28 },
  contact: { fontSize: fontSize.base },

  balanceCard: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  balanceLabel: { fontSize: fontSize.base },
  balanceValue: { flex: 1, textAlign: 'right', fontSize: fontSize.md, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cashbackRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderTopWidth: StyleSheet.hairlineWidth },
  cashbackValue: { flex: 1, textAlign: 'right', fontSize: fontSize.base, fontWeight: '700', fontVariant: ['tabular-nums'] },

  nudge: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderRadius: 12, borderWidth: 1, paddingRight: 14, overflow: 'hidden' },
  nudgeBar: { alignSelf: 'stretch', width: 4 },
  nudgeText: { flex: 1, fontSize: fontSize.base - 1, fontWeight: '600' },

  quick: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 6 },
  quickCol: { flex: 1, minHeight: 72, alignItems: 'center', gap: 6 },
  quickIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: fontSize.sm, fontWeight: '600' },

  footer: { alignItems: 'center', marginTop: 4 },
  footerTouch: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16 },
  signOut: { fontSize: fontSize.md, fontWeight: '700' },
  deleteText: { fontSize: fontSize.sm + 1, fontWeight: '600' },
  version: { fontSize: fontSize.sm, textAlign: 'center' },
});
