// src/app/fund.tsx

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createPermanentAccount,
  createTemporaryAccount,
  getBalance,
  getFunding,
} from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import type { TemporaryFunding } from '@/api/types';
import { AccountCard } from '@/components/account-card';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { MaxContentWidth } from '@/constants/theme';
import { formatLagosDate, formatNaira } from '@/lib/format';
import { radius, useColors } from '@/theme';

const MIN_AMOUNT = 100;
const MAX_AMOUNT = 1_000_000;
const POLL_MS = 5_000;

type Waiting = { funding: TemporaryFunding; startBalance: number };

export default function FundScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [amountText, setAmountText] = useState('');
  const [bvn, setBvn] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [waiting, setWaiting] = useState<Waiting | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const funding = useQuery({ queryKey: ['funding'], queryFn: getFunding });
  const balance = useQuery({
    queryKey: ['balance'],
    queryFn: getBalance,
    refetchInterval: (query) => {
      if (!waiting) return false;
      if (Date.parse(waiting.funding.expiresAt) <= Date.now()) return false;
      return (query.state.data?.balance ?? 0) > waiting.startBalance ? false : POLL_MS;
    },
  });

  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [waiting]);

  const credited = !!waiting && (balance.data?.balance ?? 0) > waiting.startBalance;
  const expired = !!waiting && !credited && Date.parse(waiting.funding.expiresAt) <= now;

  useEffect(() => {
    if (!credited) return;
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    void queryClient.invalidateQueries({ queryKey: ['funding'] });
    void queryClient.invalidateQueries({ queryKey: ['me'] });
  }, [credited, queryClient]);

  const permanent = useMutation({
    mutationFn: createPermanentAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['funding'] });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const temporary = useMutation({
    mutationFn: createTemporaryAccount,
    onSuccess: (result) => {
      setWaiting({ funding: result, startBalance: balance.data?.balance ?? 0 });
      void queryClient.invalidateQueries({ queryKey: ['funding'] });
    },
  });

  const bvnIsValid = /^\d{11}$/.test(bvn);
  const amount = amountText === '' ? Number.NaN : Number(amountText);
  const amountIsValid = Number.isInteger(amount) && amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;
  const amountError =
    showErrors && !amountIsValid
      ? `Enter a whole amount from ${formatNaira(MIN_AMOUNT)} to ${formatNaira(MAX_AMOUNT)}.`
      : null;

  function submitBvn() {
    if (!bvnIsValid || permanent.isPending) return;
    const value = bvn;
    setBvn('');
    permanent.mutate(value);
  }

  function submitAmount() {
    setShowErrors(true);
    if (!amountIsValid || temporary.isPending) return;
    temporary.mutate(amount);
  }

  function reset() {
    setWaiting(null);
    setAmountText('');
    setShowErrors(false);
    temporary.reset();
  }

  let body;
  if (funding.isLoading) {
    body = <ActivityIndicator color={colors.text} style={styles.state} />;
  } else if (funding.isError || !funding.data) {
    body = (
      <View style={[styles.state, styles.gap]}>
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {errorMessage(funding.error)}
        </Text>
        <Button label="Try again" variant="secondary" onPress={() => void funding.refetch()} />
      </View>
    );
  } else {
    const pending = funding.data.pending;
    body = (
      <>
        {funding.data.permanent ? (
          <AccountCard title="Your wallet account" account={funding.data.permanent}>
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              Transfers to this account are credited to your wallet once they are confirmed.
            </Text>
          </AccountCard>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.text }]}>
              Get a permanent account
            </Text>
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              Enter your BVN once to get an account number that always funds your wallet.
            </Text>
            <TextField
              label="BVN"
              value={bvn}
              onChangeText={(text) => setBvn(text.replace(/\D/g, '').slice(0, 11))}
              placeholder="11-digit BVN"
              secureTextEntry
              keyboardType="number-pad"
              maxLength={11}
              autoComplete="off"
              autoCorrect={false}
              importantForAutofill="no"
              editable={!permanent.isPending}
              onSubmitEditing={submitBvn}
            />
            {permanent.isError ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
                {errorMessage(permanent.error)}
              </Text>
            ) : null}
            <Button
              label="Create account"
              onPress={submitBvn}
              disabled={!bvnIsValid}
              loading={permanent.isPending}
            />
          </View>
        )}

        {waiting ? (
          <AccountCard title="Transfer to this account" account={waiting.funding}>
            <View style={styles.detail}>
              <Text style={[styles.note, { color: colors.textSecondary }]}>Amount to send</Text>
              <Text style={[styles.amount, { color: colors.text }]}>{formatNaira(waiting.funding.amount)}</Text>
            </View>
            <View style={styles.detail}>
              <Text style={[styles.note, { color: colors.textSecondary }]}>Expires</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {formatLagosDate(waiting.funding.expiresAt)}
              </Text>
            </View>
            <View
              accessibilityLiveRegion="polite"
              style={[styles.status, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {credited ? (
                <Text style={[styles.statusText, { color: colors.success }]}>
                  Payment received. Your wallet has been credited.
                </Text>
              ) : expired ? (
                <Text style={[styles.statusText, { color: colors.danger }]}>
                  This account has expired. If you already sent money, check History before trying again.
                </Text>
              ) : (
                <View style={styles.waitRow}>
                  <ActivityIndicator color={colors.text} />
                  <Text style={[styles.statusText, { color: colors.text }]}>
                    Waiting for your transfer. This updates on its own.
                  </Text>
                </View>
              )}
            </View>
            {credited || expired ? <Button label="Fund again" variant="secondary" onPress={reset} /> : null}
          </AccountCard>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.text }]}>
              Fund with a one-time account
            </Text>
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              Choose an amount and we give you a temporary account number to transfer it to.
            </Text>
            <TextField
              label="Amount (₦)"
              value={amountText}
              onChangeText={(text) => setAmountText(text.replace(/\D/g, '').slice(0, 7))}
              placeholder="5000"
              keyboardType="number-pad"
              error={amountError}
              hint={`From ${formatNaira(MIN_AMOUNT)} to ${formatNaira(MAX_AMOUNT)}`}
              editable={!temporary.isPending}
              onSubmitEditing={submitAmount}
            />
            {temporary.isError ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
                {errorMessage(temporary.error)}
              </Text>
            ) : null}
            <Button label="Get account number" onPress={submitAmount} loading={temporary.isPending} />
          </View>
        )}

        {pending.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.text }]}>
              Pending transfers
            </Text>
            {pending.map((item) => (
              <View
                key={item.reference}
                accessible
                accessibilityLabel={`${formatNaira(item.amountKobo / 100)} to ${item.bankName}, account ${item.accountNumber}`}
                style={styles.pendingRow}>
                <View style={styles.pendingText}>
                  <Text style={[styles.value, styles.left, { color: colors.text }]}>
                    {formatNaira(item.amountKobo / 100)}
                  </Text>
                  <Text style={[styles.note, { color: colors.textSecondary }]}>
                    {item.bankName} · {item.accountNumber}
                  </Text>
                </View>
                <Text style={[styles.note, { color: colors.textSecondary }]}>
                  Expires {formatLagosDate(item.expiresAt)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <View style={styles.content}>
          <Text style={[styles.balance, { color: colors.textSecondary }]}>
            Wallet balance: {formatNaira(balance.data?.balance ?? 0)}
          </Text>
          {body}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { alignItems: 'center', padding: 16 },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: 16 },
  state: { paddingVertical: 24 },
  gap: { gap: 12 },
  balance: { fontSize: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  note: { fontSize: 13, lineHeight: 18 },
  error: { fontSize: 14, fontWeight: '600' },
  detail: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  amount: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  value: { fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  left: { textAlign: 'left' },
  status: { borderRadius: radius, borderWidth: 1, padding: 12 },
  statusText: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  waitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  pendingText: { flex: 1, gap: 2 },
});
