// src/app/buy/data.tsx

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buyData, getBalance, getDataCatalog, getMe } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import type { DataPurchase } from '@/api/types';
import { Button } from '@/components/button';
import { FilterChip } from '@/components/filter-chip';
import { PlanTile } from '@/components/plan-tile';
import { PurchaseConfirm } from '@/components/purchase-confirm';
import { PurchaseResultCard } from '@/components/purchase-result';
import { SummaryRow } from '@/components/summary-row';
import { TextField } from '@/components/text-field';
import { MaxContentWidth } from '@/constants/theme';
import { usePurchaseFlow } from '@/hooks/use-purchase-flow';
import { formatNaira, groupPhone, isValidPhone, normalizePhone } from '@/lib/format';
import { fontSize, useColors } from '@/theme';

export default function BuyDataScreen() {
  const colors = useColors();
  const flow = usePurchaseFlow<DataPurchase>(buyData);

  const [phone, setPhone] = useState('');
  const [networkId, setNetworkId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [cashbackChoice, setCashbackChoice] = useState<boolean | null>(null);

  const catalog = useQuery({ queryKey: ['catalog', 'data'], queryFn: getDataCatalog });
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const balance = useQuery({ queryKey: ['balance'], queryFn: getBalance });

  const network =
    catalog.data?.networks.find((item) => item.id === networkId) ?? catalog.data?.networks[0];
  const type = network?.types.find((item) => item.id === typeId) ?? network?.types[0];
  const plans = useMemo(() => {
    if (!network) return [];
    const list = type ? network.plans.filter((item) => item.typeId === type.id) : network.plans;
    return [...list].sort((a, b) => a.price - b.price);
  }, [network, type]);
  const plan = plans.find((item) => item.id === planId);

  const phoneIsValid = isValidPhone(phone);
  const cashbackBalance = me.data?.cashbackBalance ?? 0;
  const cashbackAvailable = cashbackBalance > 0;
  const useCashback =
    cashbackAvailable && (cashbackChoice ?? me.data?.useCashbackDefault ?? false);
  const missingPin = !!me.data && !me.data.hasPin;
  const lowBalance =
    !!plan && !useCashback && balance.data !== undefined && plan.price > balance.data.balance;

  function goToConfirm() {
    setShowErrors(true);
    if (!phoneIsValid || !plan || !network) return;
    flow.begin();
  }

  function pay() {
    if (!plan) return;
    flow.pay((reference, pin) => ({
      planId: plan.id,
      phone: normalizePhone(phone),
      reference,
      pin,
      useCashback,
    }));
  }

  function buyAgain() {
    setPhone('');
    setPlanId(null);
    setShowErrors(false);
    flow.finish();
  }

  let body;
  if (catalog.isLoading) {
    body = <ActivityIndicator color={colors.text} style={styles.state} />;
  } else if (catalog.isError || !catalog.data || !network) {
    body = (
      <View style={[styles.state, styles.gap]}>
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {catalog.isError ? errorMessage(catalog.error) : 'Data plans are not available right now.'}
        </Text>
        <Button label="Try again" variant="secondary" onPress={() => void catalog.refetch()} />
      </View>
    );
  } else if (flow.result && plan) {
    body = (
      <PurchaseResultCard
        flow={flow}
        successTitle="Data sent"
        subject={`${network.name} ${plan.size} · ${formatNaira(plan.price)}`}
        onAgain={buyAgain}
      />
    );
  } else if (flow.reference && plan) {
    body = (
      <PurchaseConfirm
        flow={flow}
        recipientLabel="To"
        recipient={groupPhone(phone)}
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
        onPay={pay}
        onEdit={flow.back}>
        <SummaryRow label="Network" value={network.name} />
        <SummaryRow label="Plan" value={`${plan.size} · ${plan.validity}`} />
      </PurchaseConfirm>
    );
  } else {
    const phoneError = showErrors && !phoneIsValid ? 'Enter a valid 11-digit Nigerian number.' : null;
    const planError = showErrors && !plan ? 'Choose a data plan.' : null;

    body = (
      <>
        <View style={styles.gap}>
          <TextField
            label="Phone number"
            value={phone}
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
                onPress={() => setPhone(normalizePhone(me.data?.phone ?? ''))}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.gap}>
          <Text accessibilityRole="header" style={[styles.label, { color: colors.text }]}>
            Network
          </Text>
          <View style={styles.chips}>
            {catalog.data.networks.map((item) => (
              <FilterChip
                key={item.id}
                label={item.name}
                selected={item.id === network.id}
                onPress={() => {
                  setNetworkId(item.id);
                  setTypeId(null);
                  setPlanId(null);
                }}
              />
            ))}
          </View>
          {network.types.length > 1 ? (
            <View style={styles.chips}>
              {network.types.map((item) => (
                <FilterChip
                  key={item.id}
                  label={item.label}
                  selected={item.id === type?.id}
                  onPress={() => {
                    setTypeId(item.id);
                    setPlanId(null);
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>

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
              No plans are available for this selection right now.
            </Text>
          ) : (
            <View style={styles.grid}>
              {plans.map((item) => (
                <PlanTile
                  key={item.id}
                  size={item.size}
                  validity={item.validity}
                  price={item.price}
                  selected={item.id === plan?.id}
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

        <Button label="Continue" onPress={goToConfirm} />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontSize: fontSize.base + 1, fontWeight: '700' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  note: { fontSize: fontSize.sm + 1, lineHeight: 18 },
  body: { fontSize: fontSize.base + 1, lineHeight: 22 },
  error: { fontSize: fontSize.base, fontWeight: '600' },
});
