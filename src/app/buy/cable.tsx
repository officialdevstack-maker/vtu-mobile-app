// src/app/buy/cable.tsx

import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buyCable, getBalance, getCableCatalog, getMe, verifySmartcard } from '@/api/endpoints';
import { errorMessage, isApiError } from '@/api/errors';
import type { CablePurchase } from '@/api/types';
import { Button } from '@/components/button';
import { FilterChip } from '@/components/filter-chip';
import { PlanRow } from '@/components/plan-row';
import { PurchaseConfirm } from '@/components/purchase-confirm';
import { PurchaseResultCard } from '@/components/purchase-result';
import { SummaryRow } from '@/components/summary-row';
import { TextField } from '@/components/text-field';
import { MaxContentWidth } from '@/constants/theme';
import { usePurchaseFlow } from '@/hooks/use-purchase-flow';
import { formatNaira, groupPhone, isValidPhone, normalizePhone } from '@/lib/format';
import { fontSize, useColors } from '@/theme';

type Verification = { key: string; name: string | null };

export default function BuyCableScreen() {
  const colors = useColors();
  const flow = usePurchaseFlow<CablePurchase>(buyCable);

  const [phone, setPhone] = useState('');
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [smartcard, setSmartcard] = useState('');
  const [planId, setPlanId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [cashbackChoice, setCashbackChoice] = useState<boolean | null>(null);
  const [verified, setVerified] = useState<Verification | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const catalog = useQuery({ queryKey: ['catalog', 'cable'], queryFn: getCableCatalog });
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const balance = useQuery({ queryKey: ['balance'], queryFn: getBalance });
  const verify = useMutation({
    mutationFn: (input: { operatorId: string; smartcard: string }) =>
      verifySmartcard(input.operatorId, input.smartcard),
  });

  const operator =
    catalog.data?.operators.find((item) => item.id === operatorId) ?? catalog.data?.operators[0];
  const plans = useMemo(
    () => [...(operator?.plans ?? [])].sort((a, b) => a.price - b.price),
    [operator],
  );
  const plan = plans.find((item) => item.id === planId);

  const phoneIsValid = isValidPhone(phone);
  const smartcardIsValid = /^\d{10,11}$/.test(smartcard);
  const smartcardKey = operator ? `${operator.id}:${smartcard}` : '';
  const verification = verified?.key === smartcardKey ? verified : null;

  const cashbackBalance = me.data?.cashbackBalance ?? 0;
  const cashbackAvailable = cashbackBalance > 0;
  const useCashback =
    cashbackAvailable && (cashbackChoice ?? me.data?.useCashbackDefault ?? false);
  const missingPin = !!me.data && !me.data.hasPin;
  const lowBalance =
    !!plan && !useCashback && balance.data !== undefined && plan.price > balance.data.balance;

  async function goToConfirm() {
    setShowErrors(true);
    setVerifyError(null);
    if (!phoneIsValid || !smartcardIsValid || !plan || !operator || verify.isPending) return;
    if (verification) {
      flow.begin();
      return;
    }
    try {
      const response = await verify.mutateAsync({ operatorId: operator.id, smartcard });
      if (!response.valid) {
        setVerifyError('We could not find that smartcard. Check the number and try again.');
        return;
      }
      setVerified({ key: smartcardKey, name: response.name });
      flow.begin();
    } catch (error) {
      if (isApiError(error) && error.code === 'unavailable') {
        setVerified({ key: smartcardKey, name: null });
        flow.begin();
        return;
      }
      setVerifyError(errorMessage(error));
    }
  }

  function pay() {
    if (!plan) return;
    flow.pay((reference, pin) => ({
      planId: plan.id,
      smartcard,
      phone: normalizePhone(phone),
      reference,
      pin,
      useCashback,
    }));
  }

  function buyAgain() {
    setPhone('');
    setSmartcard('');
    setPlanId(null);
    setShowErrors(false);
    setVerified(null);
    setVerifyError(null);
    flow.finish();
  }

  let body;
  if (catalog.isLoading) {
    body = <ActivityIndicator color={colors.text} style={styles.state} />;
  } else if (catalog.isError || !catalog.data || !operator) {
    body = (
      <View style={[styles.state, styles.gap]}>
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {catalog.isError ? errorMessage(catalog.error) : 'Cable TV is not available right now.'}
        </Text>
        <Button label="Try again" variant="secondary" onPress={() => void catalog.refetch()} />
      </View>
    );
  } else if (flow.result && plan) {
    body = (
      <PurchaseResultCard
        flow={flow}
        successTitle="Subscription renewed"
        subject={`${operator.name} ${plan.name} · ${formatNaira(plan.price)}`}
        onAgain={buyAgain}
      />
    );
  } else if (flow.reference && plan) {
    body = (
      <PurchaseConfirm
        flow={flow}
        recipientLabel="Smartcard"
        recipient={smartcard}
        amount={plan.price}
        cashback={
          cashbackAvailable
            ? { available: cashbackBalance, value: useCashback, onChange: setCashbackChoice }
            : null
        }
        missingPin={missingPin}
        lowBalanceText={
          lowBalance
            ? `Your wallet balance is ${formatNaira(balance.data?.balance ?? 0)}, which may not cover this purchase.`
            : null
        }
        note={
          verification && !verification.name
            ? 'We could not verify this smartcard right now. Check the number carefully; we check it again when you pay.'
            : undefined
        }
        onPay={pay}
        onEdit={flow.back}>
        <SummaryRow label="Provider" value={operator.name} />
        <SummaryRow label="Plan" value={`${plan.name} · ${plan.validity}`} />
        {verification?.name ? <SummaryRow label="Customer" value={verification.name} /> : null}
        <SummaryRow label="Phone number" value={groupPhone(phone)} />
      </PurchaseConfirm>
    );
  } else {
    const phoneError = showErrors && !phoneIsValid ? 'Enter a valid 11-digit Nigerian number.' : null;
    const smartcardError =
      showErrors && !smartcardIsValid ? 'Enter the 10 or 11 digit smartcard number.' : null;
    const planError = showErrors && !plan ? 'Choose a plan.' : null;

    body = (
      <>
        <View style={styles.gap}>
          <Text accessibilityRole="header" style={[styles.label, { color: colors.text }]}>
            Provider
          </Text>
          <View style={styles.chips}>
            {catalog.data.operators.map((item) => (
              <FilterChip
                key={item.id}
                label={item.name}
                selected={item.id === operator.id}
                disabled={verify.isPending}
                onPress={() => {
                  setOperatorId(item.id);
                  setPlanId(null);
                  setVerified(null);
                  setVerifyError(null);
                }}
              />
            ))}
          </View>
        </View>

        <TextField
          label="Smartcard / IUC number"
          value={smartcard}
          editable={!verify.isPending}
          onChangeText={(text) => {
            const value = text.replace(/\D/g, '').slice(0, 11);
            if (value !== smartcard) setVerified(null);
            setSmartcard(value);
            setVerifyError(null);
          }}
          placeholder="10 or 11 digits"
          keyboardType="number-pad"
          maxLength={11}
          autoComplete="off"
          autoCorrect={false}
          importantForAutofill="no"
          error={smartcardError ?? verifyError}
          hint={verification?.name ? `Verified: ${verification.name}` : undefined}
        />

        <View style={styles.gap}>
          <View style={styles.labelRow}>
            <Text accessibilityRole="header" style={[styles.label, { color: colors.text }]}>
              Choose a plan
            </Text>
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              Balance: {balance.data ? formatNaira(balance.data.balance) : '...'}
            </Text>
          </View>
          {plans.length === 0 ? (
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              No plans are available for this provider right now.
            </Text>
          ) : (
            <View style={styles.gap}>
              {plans.map((item) => (
                <PlanRow
                  key={item.id}
                  name={item.name}
                  validity={item.validity}
                  price={item.price}
                  selected={item.id === plan?.id}
                  disabled={verify.isPending}
                  onPress={() => setPlanId(item.id)}
                />
              ))}
            </View>
          )}
          {planError ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
              {planError}
            </Text>
          ) : null}
        </View>

        <View style={styles.gap}>
          <TextField
            label="Phone number"
            value={phone}
            editable={!verify.isPending}
            onChangeText={(text) => setPhone(text.replace(/[^\d+]/g, '').slice(0, 14))}
            placeholder="08031234567"
            keyboardType="phone-pad"
            autoComplete="off"
            autoCorrect={false}
            error={phoneError}
            hint={phoneIsValid ? groupPhone(phone) : undefined}
          />
          {me.data?.phone ? (
            <View style={styles.chips}>
              <FilterChip
                label="My number"
                selected={false}
                disabled={verify.isPending}
                onPress={() => setPhone(normalizePhone(me.data?.phone ?? ''))}
              />
            </View>
          ) : null}
        </View>

        <Button
          label="Continue"
          onPress={() => void goToConfirm()}
          loading={verify.isPending}
        />
      </>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <View style={styles.content}>{body}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { alignItems: 'center', padding: 16 },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: 16 },
  state: { paddingVertical: 24 },
  gap: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontSize: fontSize.base + 1, fontWeight: '700' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  note: { fontSize: fontSize.sm + 1, lineHeight: 18 },
  body: { fontSize: fontSize.base + 1, lineHeight: 22 },
  error: { fontSize: fontSize.base, fontWeight: '600' },
});
