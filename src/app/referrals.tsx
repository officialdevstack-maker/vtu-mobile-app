// src/app/referrals.tsx

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { applyReferralCode, getReferrals } from '@/api/account';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { ErrorState, LoadingState } from '@/components/states';
import { TextField } from '@/components/text-field';
import { MaxContentWidth } from '@/constants/theme';
import { formatNaira } from '@/lib/format';
import { useColors } from '@/theme';

export default function ReferralsScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState('');
  const query = useQuery({ queryKey: ['referrals'], queryFn: getReferrals });
  const apply = useMutation({
    mutationFn: applyReferralCode,
    onSuccess: () => {
      setCode('');
      void queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const data = query.data;
  async function copy() {
    if (!data) return;
    await Clipboard.setStringAsync(data.code);
    setCopied(true);
  }
  function share() {
    if (!data) return;
    void Share.share({ message: `Join me on Spur VTU and use my referral code ${data.code}.` });
  }
  function submitCode() {
    const value = code.trim().toUpperCase();
    if (!value || apply.isPending) return;
    apply.mutate(value);
  }

  let body;
  if (query.isLoading) {
    body = <LoadingState />;
  } else if (query.isError || !data) {
    body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  } else {
    body = (
      <>
        <View style={[styles.codeCard, { backgroundColor: colors.wallet }]}>
          <Text style={[styles.codeLabel, { color: colors.onWalletMuted }]}>Your referral code</Text>
          <Text accessibilityLabel={`Your referral code is ${data.code.split('').join(' ')}`} style={[styles.code, { color: colors.onWallet }]}>{data.code}</Text>
        </View>
        <View style={styles.buttons}>
          <View style={styles.flex}><Button label={copied ? 'Copied' : 'Copy code'} variant="secondary" onPress={() => void copy()} /></View>
          <View style={styles.flex}><Button label="Share" onPress={share} /></View>
        </View>
        <View style={styles.stats}>
          <Stat label="Invited" value={String(data.invited)} />
          <Stat label="Rewarded" value={String(data.rewarded)} />
          <Stat label="Earned" value={formatNaira(data.earned)} />
        </View>
        {data.waitingOnFirstPurchase ? <Text style={[styles.note, { color: colors.textSecondary }]}>Your referral reward arrives after your first purchase.</Text> : null}
        {data.hasReferrer ? null : (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.text }]}>Have a code from a friend?</Text>
            <TextField label="Referral code" value={code} onChangeText={(text) => setCode(text.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16))} autoCapitalize="characters" autoCorrect={false} placeholder="ABCDEFGH" editable={!apply.isPending} onSubmitEditing={submitCode} />
            {apply.isError ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>{errorMessage(apply.error)}</Text> : null}
            <Button label="Apply code" onPress={submitCode} disabled={code.trim() === ''} loading={apply.isPending} />
          </View>
        )}
      </>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={styles.content}>{body}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { alignItems: 'center', padding: 16 },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: 12 },
  state: { paddingVertical: 16 },
  gap: { gap: 10 },
  flex: { flex: 1 },
  buttons: { flexDirection: 'row', gap: 10 },
  codeCard: { borderRadius: 20, padding: 16, gap: 6 },
  codeLabel: { fontSize: 14, fontWeight: '600' },
  code: { fontSize: 32, fontWeight: '700', letterSpacing: 4 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 12, gap: 4 },
  statLabel: { fontSize: 12 },
  statValue: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  note: { fontSize: 14, lineHeight: 20 },
  error: { fontSize: 14, fontWeight: '600' },
});
