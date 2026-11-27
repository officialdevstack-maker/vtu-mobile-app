// src/app/(tabs)/rewards.tsx

import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCashback, getReferrals } from '@/api/account';
import { Button } from '@/components/button';
import { ErrorState, LoadingState } from '@/components/states';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { fontSize, radius, useColors } from '@/theme';

export default function RewardsScreen() {
  const colors = useColors();
  const cashback = useQuery({ queryKey: ['cashback'], queryFn: getCashback });
  const referrals = useQuery({ queryKey: ['referrals'], queryFn: getReferrals });

  return (
    <SafeAreaView edges={['top']} style={[styles.fill, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={cashback.isRefetching || referrals.isRefetching}
            onRefresh={() => {
              void cashback.refetch();
              void referrals.refetch();
            }}
          />
        }>
        <View style={styles.content}>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
              Rewards
            </Text>
            <Text style={[styles.intro, { color: colors.textSecondary }]}>
              Cashback earned and rewards from inviting friends.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeading}>
              <View style={[styles.icon, { backgroundColor: `${colors.success}1F` }]}>
                <SymbolView
                  tintColor={colors.success}
                  name={{ ios: 'gift.fill', android: 'redeem', web: 'redeem' }}
                  size={19}
                />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Cashback</Text>
            </View>
            {cashback.isLoading ? (
              <LoadingState compact />
            ) : cashback.isError || !cashback.data ? (
              <ErrorState compact error={cashback.error} onRetry={() => void cashback.refetch()} />
            ) : (
              <>
                <Text style={[styles.amount, { color: colors.text }]}>
                  {formatNaira(cashback.data.balance)}
                </Text>
                <Text style={[styles.detail, { color: colors.textSecondary }]}>
                  {cashback.data.settings.enabled
                    ? `${cashback.data.history.length} cashback activities`
                    : 'Cashback is not active right now.'}
                </Text>
                <Button
                  label="View cashback"
                  variant="secondary"
                  onPress={() => router.push('/cashback')}
                />
              </>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeading}>
              <View style={[styles.icon, { backgroundColor: `${colors.primary}33` }]}>
                <SymbolView
                  tintColor={colors.text}
                  name={{ ios: 'person.2.fill', android: 'group', web: 'group' }}
                  size={19}
                />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Referrals</Text>
            </View>
            {referrals.isLoading ? (
              <LoadingState compact />
            ) : referrals.isError || !referrals.data ? (
              <ErrorState compact error={referrals.error} onRetry={() => void referrals.refetch()} />
            ) : (
              <>
                <Text style={[styles.detail, { color: colors.textSecondary }]}>
                  Your referral code
                </Text>
                <Text
                  accessibilityLabel={`Your referral code is ${referrals.data.code.split('').join(' ')}`}
                  style={[styles.code, { color: colors.text }]}>
                  {referrals.data.code}
                </Text>
                <Text style={[styles.detail, { color: colors.textSecondary }]}>
                  {referrals.data.invited} invited · {referrals.data.rewarded} rewarded ·{' '}
                  {formatNaira(referrals.data.earned)} earned
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="View referrals and share your code"
                  onPress={() => router.push('/referrals')}
                  style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                  <Text style={[styles.linkText, { color: colors.text }]}>View referrals</Text>
                  <SymbolView
                    tintColor={colors.textSecondary}
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    size={12}
                  />
                </Pressable>
              </>
            )}
          </View>
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
  heading: { gap: 4 },
  title: { fontSize: fontSize.xl, fontWeight: '700' },
  intro: { fontSize: fontSize.base, lineHeight: 20 },
  card: { borderWidth: 1, borderRadius: radius + 4, padding: 16, gap: 10 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: fontSize.lg, fontWeight: '700' },
  amount: { fontSize: fontSize.xl, fontWeight: '700', fontVariant: ['tabular-nums'] },
  code: { fontSize: fontSize.xl, fontWeight: '700', letterSpacing: 2 },
  detail: { fontSize: fontSize.sm + 1, lineHeight: 20 },
  state: { minHeight: 44, justifyContent: 'center', gap: 8 },
  error: { fontSize: fontSize.base },
  link: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkText: { fontSize: fontSize.base, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
