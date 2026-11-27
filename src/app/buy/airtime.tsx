// src/app/buy/airtime.tsx

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buyAirtime, getAirtimeCatalog, getBalance, getMe } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import type { AirtimePurchase } from '@/api/types';
import { AmountTile } from '@/components/amount-tile';
import { Button } from '@/components/button';
import { FilterChip } from '@/components/filter-chip';
import { PurchaseConfirm } from '@/components/purchase-confirm';
import { PurchaseResultCard } from '@/components/purchase-result';
import { SummaryRow } from '@/components/summary-row';
import { TextField } from '@/components/text-field';
import { MaxContentWidth } from '@/constants/theme';
import { usePurchaseFlow } from '@/hooks/use-purchase-flow';
import {
  airtimeDisplayPrice,
  formatNaira,
  groupPhone,
  isValidPhone,
  normalizePhone,
} from '@/lib/format';
import { fontSize, radius, useColors } from '@/theme';

const PRESETS = [100, 200, 500, 1000, 2000, 5000] as const;
const MAX_AMOUNT = 1_000_000;

export default function BuyAirtimeScreen() {
  const colors = useColors();
  const flow = usePurchaseFlow<AirtimePurchase>(buyAirtime);

  const [phone, setPhone] = useState('');
  const [networkId, setNetworkId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [amountText, setAmountText] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [cashbackChoice, setCashbackChoice] = useState<boolean | null>(null);

  const catalog = useQuery({ queryKey: ['catalog', 'airtime'], queryFn: getAirtimeCatalog });
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const balance = useQuery({ queryKey: ['balance'], queryFn: getBalance });

  const network =
    catalog.data?.networks.find((item) => item.id === networkId) ?? catalog.data?.networks[0];
  const type = network?.types.find((item) => item.id === typeId) ?? network?.types[0];
  const ranges = useMemo(() => type?.ranges ?? [], [type]);

  const amount = amountText === '' ? Number.NaN : Number(amountText);
  const range = ranges.find((item) => amount >= item.min && amount <= item.max);
  const amountIsValid =
    Number.isInteger(amount) && amount >= 1 && amount <= MAX_AMOUNT && !!range;
  const minAmount = ranges.length > 0 ? Math.min(...ranges.map((item) => item.min)) : 0;
  const maxAmount =
    ranges.length > 0 ? Math.min(MAX_AMOUNT, Math.max(...ranges.map((item) => item.max))) : 0;
  const phoneIsValid = isValidPhone(phone);
  const displayPrice = amountIsValid && range ? airtimeDisplayPrice(amount, range.discount) : null;

  const cashbackBalance = me.data?.cashbackBalance ?? 0;
  const cashbackAvailable = cashbackBalance > 0;
  const useCashback =
    cashbackAvailable && (cashbackChoice ?? me.data?.useCashbackDefault ?? false);
  const missingPin = !!me.data && !me.data.hasPin;
  const lowBalance =
    displayPrice !== null &&
    !useCashback &&
    balance.data !== undefined &&
    displayPrice > balance.data.balance;

  function goToConfirm() {
    setShowErrors(true);
    if (!phoneIsValid || !amountIsValid || !network || !type) return;
    flow.begin();
  }

  function pay() {
    if (!network || !type || !amountIsValid) return;
    flow.pay((reference, pin) => ({
      networkId: network.id,
      typeId: type.id,
      amount,
      phone: normalizePhone(phone),
      reference,
      pin,
      useCashback,
    }));
  }

  function buyAgain() {
    setPhone('');
    setAmountText('');
    setShowErrors(false);
    flow.finish();
  }

  let body;
  if (catalog.isLoading) {
    body = <ActivityIndicator color={colors.text} style={styles.state} />;
  } else if (catalog.isError || !catalog.data || !network || !type) {
    body = (
      <View style={[styles.state, styles.gap]}>
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {catalog.isError ? errorMessage(catalog.error) : 'Airtime is not available right now.'}
        </Text>
        <Button label="Try again" variant="secondary" onPress={() => void catalog.refetch()} />
      </View>
    );
  } else if (flow.result) {
    body = (
      <PurchaseResultCard
        flow={flow}
        successTitle="Airtime sent"
        subject={`${network.name} airtime · ${formatNaira(amount)}`}
        onAgain={buyAgain}
      />
    );
  } else if (flow.reference) {
    body = (
      <PurchaseConfirm
        flow={flow}
        recipientLabel="To"
        recipient={groupPhone(phone)}
        amount={displayPrice ?? amount}
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
        <SummaryRow label="Airtime" value={formatNaira(amount)} />
        {range && range.discount > 0 ? (
          <SummaryRow label="Discount" value={`${range.discount}%`} />
        ) : null}
      </PurchaseConfirm>
    );
  } else {
    const phoneError = showErrors && !phoneIsValid ? 'Enter a valid 11-digit Nigerian number.' : null;
    const amountError =
      showErrors && !amountIsValid
        ? `Enter a whole amount from ${formatNaira(minAmount)} to ${formatNaira(maxAmount)}.`
        : null;

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
                  selected={item.id === type.id}
                  onPress={() => setTypeId(item.id)}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.amountCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}>
          <View style={styles.labelRow}>
            <Text accessibilityRole="header" style={[styles.label, { color: colors.text }]}>
              Airtime amount
            </Text>
            <View style={[styles.balanceBadge, { backgroundColor: colors.background }]}>
              <Text style={[styles.balanceText, { color: colors.textSecondary }]}>
                Balance {balance.data ? formatNaira(balance.data.balance) : '...'}
              </Text>
            </View>
          </View>
          <TextField
            label="Enter amount (₦)"
            value={amountText}
            onChangeText={(text) => setAmountText(text.replace(/\D/g, '').slice(0, 7))}
            placeholder={`${minAmount}-${maxAmount.toLocaleString('en-NG')}`}
            keyboardType="number-pad"
            error={amountError}
            hint={
              displayPrice !== null && range && range.discount > 0
                ? `You pay ${formatNaira(displayPrice)} (${range.discount}% off)`
                : undefined
            }
          />
          <Text style={[styles.quickLabel, { color: colors.text }]}>Quick amounts</Text>
          <View style={styles.grid}>
            {PRESETS.map((value) => {
              const presetRange = ranges.find((item) => value >= item.min && value <= item.max);
              if (!presetRange) return null;
              return (
                <AmountTile
                  key={value}
                  amount={value}
                  selected={amount === value}
                  onPress={() => setAmountText(String(value))}
                />
              );
            })}
          </View>
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
  error: { fontSize: fontSize.base, fontWeight: '600' },
  amountCard: { borderRadius: radius + 4, borderWidth: 1, padding: 12, gap: 10 },
  balanceBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  balanceText: { fontSize: fontSize.xs, fontWeight: '600', fontVariant: ['tabular-nums'] },
  quickLabel: { fontSize: fontSize.sm + 1, fontWeight: '700' },
});
