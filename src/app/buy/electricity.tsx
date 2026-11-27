// src/app/buy/electricity.tsx

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

import {
  buyElectricity,
  getBalance,
  getElectricityCatalog,
  getMe,
  verifyMeter,
} from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import type { ElectricityPurchase, MeterType } from '@/api/types';
import { AmountTile } from '@/components/amount-tile';
import { Button } from '@/components/button';
import { FilterChip } from '@/components/filter-chip';
import { PurchaseConfirm } from '@/components/purchase-confirm';
import { PurchaseResultCard } from '@/components/purchase-result';
import { SummaryRow } from '@/components/summary-row';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { TextField } from '@/components/text-field';
import { MaxContentWidth } from '@/constants/theme';
import { usePurchaseFlow } from '@/hooks/use-purchase-flow';
import { useSlowLoading } from '@/hooks/use-slow-loading';
import { formatNaira, groupPhone, isValidPhone, normalizePhone } from '@/lib/format';
import { fontSize, radius, useColors } from '@/theme';

const PRESETS = [1000, 2000, 3000, 5000, 10000] as const;
const MAX_AMOUNT = 1_000_000;
const METER_TYPES: { value: MeterType; label: string }[] = [
  { value: 'prepaid', label: 'Prepaid' },
  { value: 'postpaid', label: 'Postpaid' },
];

type Verification = { key: string; name: string; address: string };

export default function BuyElectricityScreen() {
  const colors = useColors();
  const flow = usePurchaseFlow<ElectricityPurchase>(buyElectricity);

  const [phone, setPhone] = useState('');
  const [discoId, setDiscoId] = useState<string | null>(null);
  const [meterType, setMeterType] = useState<MeterType>('prepaid');
  const [meter, setMeter] = useState('');
  const [amountText, setAmountText] = useState('');
  const [providerOpen, setProviderOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [cashbackChoice, setCashbackChoice] = useState<boolean | null>(null);
  const [verified, setVerified] = useState<Verification | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const catalog = useQuery({ queryKey: ['catalog', 'electricity'], queryFn: getElectricityCatalog });
  const slow = useSlowLoading(catalog.isLoading);
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const balance = useQuery({ queryKey: ['balance'], queryFn: getBalance });
  const verify = useMutation({
    mutationFn: (input: { discoId: string; meterType: MeterType; meter: string }) =>
      verifyMeter(input.discoId, input.meterType, input.meter),
  });

  const disco = catalog.data?.discos.find((item) => item.id === discoId) ?? catalog.data?.discos[0];
  const minAmount = Math.max(1, disco?.min ?? 1);
  const maxAmount = disco ? Math.min(MAX_AMOUNT, disco.max) : 0;
  const amount = amountText === '' ? Number.NaN : Number(amountText);
  const amountIsValid =
    !!disco &&
    Number.isInteger(amount) &&
    amount >= Math.max(1, minAmount) &&
    amount <= maxAmount;

  const phoneIsValid = isValidPhone(phone);
  const meterIsValid = /^\d{10,13}$/.test(meter);
  const meterKey = disco ? `${disco.id}:${meterType}:${meter}` : '';
  const verification = verified?.key === meterKey ? verified : null;

  const cashbackBalance = me.data?.cashbackBalance ?? 0;
  const cashbackAvailable = cashbackBalance > 0;
  const useCashback =
    cashbackAvailable && (cashbackChoice ?? me.data?.useCashbackDefault ?? false);
  const missingPin = !!me.data && !me.data.hasPin;
  const lowBalance =
    amountIsValid &&
    !useCashback &&
    balance.data !== undefined &&
    amount > balance.data.balance;

  async function goToConfirm() {
    setShowErrors(true);
    setVerifyError(null);
    setProviderOpen(false);
    if (!phoneIsValid || !meterIsValid || !amountIsValid || !disco || verify.isPending) return;
    if (verification) {
      flow.begin();
      return;
    }
    try {
      const response = await verify.mutateAsync({ discoId: disco.id, meterType, meter });
      if (!response.valid) {
        setVerifyError('We could not find that meter. Check the number and meter type.');
        return;
      }
      setVerified({ key: meterKey, name: response.name, address: response.address });
      flow.begin();
    } catch (error) {
      setVerifyError(errorMessage(error));
    }
  }

  function pay() {
    if (!disco || !amountIsValid) return;
    flow.pay((reference, pin) => ({
      discoId: disco.id,
      meterType,
      meter,
      amount,
      phone: normalizePhone(phone),
      reference,
      pin,
      useCashback,
    }));
  }

  function buyAgain() {
    setPhone('');
    setMeter('');
    setAmountText('');
    setShowErrors(false);
    setVerified(null);
    setVerifyError(null);
    flow.finish();
  }

  let body;
  if (catalog.isLoading) {
    body = <LoadingState slow={slow} />;
  } else if (catalog.isError || !catalog.data || !disco) {
    body = catalog.isError ? (
      <ErrorState error={catalog.error} onRetry={() => void catalog.refetch()} />
    ) : (
      <EmptyState
        title="Electricity is unavailable"
        message="Electricity is not available right now."
        actionLabel="Try again"
        onAction={() => void catalog.refetch()}
      />
    );
  } else if (flow.result && amountIsValid) {
    body = (
      <PurchaseResultCard
        flow={flow}
        successTitle="Electricity purchased"
        subject={`${disco.name} ${meterType} · ${formatNaira(amount)}`}
        onAgain={buyAgain}
      />
    );
  } else if (flow.reference && amountIsValid) {
    body = (
      <PurchaseConfirm
        flow={flow}
        recipientLabel="Meter"
        recipient={meter}
        amount={amount}
        amountLabel="Amount"
        payLabel="Pay now"
        cashback={
          cashbackAvailable
            ? { available: cashbackBalance, value: useCashback, onChange: setCashbackChoice }
            : null
        }
        missingPin={missingPin}
        lowBalanceText={
          lowBalance
            ? `Your wallet balance is ${formatNaira(balance.data?.balance ?? 0)}, which may not cover this amount.`
            : null
        }
        note="Check the customer name and address carefully. Electricity cannot be taken back once it is sent to a meter."
        onPay={pay}
        onEdit={flow.back}>
        <SummaryRow label="Provider" value={disco.name} />
        <SummaryRow label="Meter type" value={meterType === 'prepaid' ? 'Prepaid' : 'Postpaid'} />
        {verification ? <SummaryRow label="Customer" value={verification.name} /> : null}
        {verification ? <SummaryRow label="Address" value={verification.address} /> : null}
        <SummaryRow label="Phone number" value={groupPhone(phone)} />
        <SummaryRow label="Amount" value={formatNaira(amount)} />
      </PurchaseConfirm>
    );
  } else {
    const phoneError = showErrors && !phoneIsValid ? 'Enter a valid 11-digit Nigerian number.' : null;
    const meterError = showErrors && !meterIsValid ? 'Enter the 10 to 13 digit meter number.' : null;
    const amountError =
      showErrors && !amountIsValid
        ? `Enter a whole amount from ${formatNaira(minAmount)} to ${formatNaira(maxAmount)}.`
        : null;
    const presets = PRESETS.filter((value) => value >= minAmount && value <= maxAmount);

    body = (
      <>
        <View style={styles.gap}>
          <Text accessibilityRole="header" style={[styles.label, { color: colors.text }]}>
            Provider
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Provider: ${disco.name}`}
            accessibilityHint={providerOpen ? 'Hide providers' : 'Show provider options'}
            accessibilityState={{ disabled: verify.isPending, expanded: providerOpen }}
            disabled={verify.isPending}
            onPress={() => setProviderOpen((open) => !open)}
            style={({ pressed }) => [
              styles.providerSelect,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
              verify.isPending && styles.disabled,
            ]}>
            <Text style={[styles.providerValue, { color: colors.text }]}>{disco.name}</Text>
            <SymbolView
              name={{
                ios: providerOpen ? 'chevron.up' : 'chevron.down',
                android: providerOpen ? 'expand_less' : 'expand_more',
                web: providerOpen ? 'expand_less' : 'expand_more',
              }}
              tintColor={colors.textSecondary}
              size={20}
            />
          </Pressable>
          {providerOpen ? (
            <View
              style={[
                styles.providerOptions,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              {catalog.data.discos.map((item, index) => {
                const selected = item.id === disco.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="radio"
                    accessibilityLabel={item.name}
                    accessibilityState={{ checked: selected, disabled: verify.isPending }}
                    disabled={verify.isPending}
                    onPress={() => {
                      setDiscoId(item.id);
                      setVerified(null);
                      setVerifyError(null);
                      setProviderOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.providerOption,
                      index < catalog.data.discos.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.border,
                      },
                      selected && { backgroundColor: colors.background },
                      pressed && styles.pressed,
                      verify.isPending && styles.disabled,
                    ]}>
                    <Text style={[styles.providerValue, { color: colors.text }]}>{item.name}</Text>
                    {selected ? (
                      <SymbolView
                        name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                        tintColor={colors.primary}
                        size={18}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <View style={styles.chips}>
            {METER_TYPES.map((item) => (
              <FilterChip
                key={item.value}
                label={item.label}
                selected={item.value === meterType}
                disabled={verify.isPending}
                onPress={() => {
                  setMeterType(item.value);
                  setVerified(null);
                  setVerifyError(null);
                }}
              />
            ))}
          </View>
        </View>

        <TextField
          label="Meter number"
          value={meter}
          editable={!verify.isPending}
          onChangeText={(text) => {
            const value = text.replace(/\D/g, '').slice(0, 13);
            if (value !== meter) setVerified(null);
            setMeter(value);
            setVerifyError(null);
          }}
          placeholder="10 to 13 digits"
          keyboardType="number-pad"
          maxLength={13}
          autoComplete="off"
          autoCorrect={false}
          importantForAutofill="no"
          error={meterError ?? verifyError}
          hint={verification ? `Verified: ${verification.name}` : undefined}
        />

        <View style={styles.gap}>
          <View style={styles.labelRow}>
            <Text accessibilityRole="header" style={[styles.label, { color: colors.text }]}>
              Amount
            </Text>
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              Balance: {balance.data ? formatNaira(balance.data.balance) : '...'}
            </Text>
          </View>
          {presets.length > 0 ? (
            <View style={styles.grid}>
              {presets.map((value) => (
                <AmountTile
                  key={value}
                  amount={value}
                  selected={amount === value}
                  disabled={verify.isPending}
                  onPress={() => setAmountText(String(value))}
                />
              ))}
            </View>
          ) : null}
          <TextField
            label="Enter amount (₦)"
            value={amountText}
            editable={!verify.isPending}
            onChangeText={(text) => setAmountText(text.replace(/\D/g, '').slice(0, 7))}
            placeholder={`${minAmount}-${maxAmount.toLocaleString('en-NG')}`}
            keyboardType="number-pad"
            error={amountError}
            hint={`From ${formatNaira(minAmount)} to ${formatNaira(maxAmount)}`}
          />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontSize: fontSize.base + 1, fontWeight: '700' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  note: { fontSize: fontSize.sm + 1, lineHeight: 18 },
  error: { fontSize: fontSize.base, fontWeight: '600' },
  providerSelect: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerOptions: { borderRadius: radius, borderWidth: 1, overflow: 'hidden' },
  providerOption: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerValue: { fontSize: fontSize.base + 1, fontWeight: '600' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.55 },
});
