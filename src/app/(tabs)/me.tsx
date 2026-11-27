// src/app/(tabs)/me.tsx

import { useMutation, useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { useColors } from '@/theme';

export default function MeScreen() {
  const colors = useColors();
  const { isSignedIn, isMockMode, signOut } = useSession();
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
      'Your account will be suspended and queued for deletion.',
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
        refreshControl={<RefreshControl refreshing={me.isRefetching} onRefresh={() => void me.refetch()} />}>
        <View style={styles.content}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Me</Text>

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
              <View style={[styles.profile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={[styles.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.avatarText, { color: colors.onPrimary }]}>{initial}</Text>
                </View>
                <View style={styles.profileText}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{profile.name}</Text>
                  <Text style={[styles.contact, { color: colors.textSecondary }]} numberOfLines={1}>{contact}</Text>
                  <View style={styles.pills}>
                    <View style={[styles.pill, { backgroundColor: `${colors.primary}33` }]}>
                      <Text style={[styles.pillText, { color: colors.text }]}>{profile.package.name}</Text>
                    </View>
                    {profile.verified ? (
                      <View style={[styles.pill, { backgroundColor: `${colors.success}1F` }]}>
                        <SymbolView tintColor={colors.success} name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }} size={12} />
                        <Text style={[styles.pillText, { color: colors.success }]}>Verified</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
              <View style={styles.stats}>
                <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Wallet</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{formatNaira(profile.walletBalance)}</Text>
                </View>
                <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Cashback</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{formatNaira(profile.cashbackBalance)}</Text>
                </View>
              </View>
            </>
          )}

          <Text style={[styles.section, { color: colors.text }]}>Account</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MenuRow first label="Add money" icon={SERVICE_ICON.wallet} onPress={() => router.push('/fund')} />
            <MenuRow label="Cashback" icon={{ ios: 'gift.fill', android: 'redeem', web: 'redeem' }} onPress={() => router.push('/cashback')} />
            <MenuRow label="Referrals" icon={{ ios: 'person.2.fill', android: 'group', web: 'group' }} onPress={() => router.push('/referrals')} />
            <MenuRow label="Notifications" value={profile && profile.unreadCount > 0 ? `${profile.unreadCount} new` : undefined} icon={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} onPress={() => router.push('/notifications')} />
          </View>

          <Text style={[styles.section, { color: colors.text }]}>Security and support</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MenuRow first label="Transaction PIN" value={profile ? (profile.hasPin ? 'Set' : 'Not set') : undefined} icon={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} onPress={() => router.push('/pin')} />
            <MenuRow label="Help and support" icon={{ ios: 'headphones', android: 'support_agent', web: 'support_agent' }} onPress={() => router.push('/help')} />
          </View>

          {deletion.isError ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
              {errorMessage(deletion.error)}
            </Text>
          ) : null}
          {isMockMode ? null : (
            <View style={styles.gap}>
              <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MenuRow first danger label="Delete account" icon={{ ios: 'trash.fill', android: 'delete', web: 'delete' }} onPress={confirmDelete} />
              </View>
            </View>
          )}
          {version ? <Text style={[styles.version, { color: colors.textSecondary }]}>Spur VTU v{version}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { alignItems: 'center', paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Math.floor((BottomTabInset + Spacing.one) / 2) },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  state: { paddingVertical: 16 },
  gap: { gap: 10 },
  error: { fontSize: 14, fontWeight: '600' },
  section: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 16 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700' },
  profileText: { flex: 1, gap: 2 },
  name: { fontSize: 18, fontWeight: '700' },
  contact: { fontSize: 13 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 12, fontWeight: '700' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, gap: 4 },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  version: { fontSize: 12, textAlign: 'center', marginTop: 2 },
});
