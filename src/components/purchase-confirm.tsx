// src/components/purchase-confirm.tsx

import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, Switch, Text, View, type TextInputInstance } from 'react-native';

import { errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { PinInput } from '@/components/pin-input';
import type { PurchaseFlowView } from '@/hooks/use-purchase-flow';
import { formatNaira } from '@/lib/format';
import { fontSize, radius, useColors } from '@/theme';

type CashbackOption = {
  available: number;
  value: boolean;
  onChange: (value: boolean) => void;
};

type PurchaseConfirmProps = {
  flow: PurchaseFlowView;
  recipientLabel: string;
  recipient: string;
  amount: number;
  amountLabel?: string;
  payLabel?: string;
  cashback: CashbackOption | null;
  missingPin: boolean;
  lowBalanceText: string | null;
  note?: string;
  onPay: () => void;
  onEdit: () => void;
  children: ReactNode;
};

export function PurchaseConfirm({
  flow,
  recipientLabel,
  recipient,
  amount,
  amountLabel = 'You pay',
  payLabel = `Pay ${formatNaira(amount)}`,
  cashback,
  missingPin,
  lowBalanceText,
  note,
  onPay,
  onEdit,
  children,
}: PurchaseConfirmProps) {
  const colors = useColors();
  const inputRef = useRef<TextInputInstance | null>(null);
  const pinError = flow.showPinError && flow.pin.length !== 4 ? 'Enter your 4-digit PIN.' : null;

  useEffect(() => {
    if (flow.payError) inputRef.current?.focus();
  }, [flow.payError]);

  return (
    <>
      <View
        accessible
        accessibilityLabel={`${recipientLabel} ${recipient}. ${amountLabel} ${formatNaira(amount)}.`}
        style={styles.hero}>
        <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>{recipientLabel}</Text>
        <Text style={[styles.recipient, { color: colors.text }]}>{recipient}</Text>
        <Text style={[styles.heroLabel, styles.payLabel, { color: colors.textSecondary }]}>
          {amountLabel}
        </Text>
        <Text style={[styles.amount, { color: colors.text }]}>{formatNaira(amount)}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
        {cashback ? (
          <View style={styles.switchRow}>
            <Text style={[styles.body, styles.flex, { color: colors.text }]}>
              Use cashback ({formatNaira(cashback.available)} available)
            </Text>
            <Switch
              accessibilityLabel="Use cashback"
              value={cashback.value}
              onValueChange={cashback.onChange}
              disabled={flow.isPaying || flow.unknown}
            />
          </View>
        ) : null}
        {note ? <Text style={[styles.note, { color: colors.textSecondary }]}>{note}</Text> : null}
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          The final amount is confirmed by our server when you pay.
        </Text>
      </View>

      {lowBalanceText ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
            {lowBalanceText}
          </Text>
          <Button label="Add money" variant="secondary" onPress={() => router.push('/fund')} />
        </View>
      ) : null}

      {missingPin ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.body, { color: colors.text }]}>
            You need a transaction PIN before you can buy.
          </Text>
          <Button label="Set your PIN" onPress={() => router.push('/pin')} />
        </View>
      ) : flow.unknown ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
            We could not confirm whether your purchase went through. Check its status before trying again.
          </Text>
          {flow.checkError ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
              {errorMessage(flow.checkError)}
            </Text>
          ) : null}
          <Button label="Check status" onPress={flow.checkStatus} loading={flow.checking} />
        </View>
      ) : (
        <>
          {flow.notice ? (
            <Text style={[styles.body, styles.center, { color: colors.textSecondary }]}>
              {flow.notice}
            </Text>
          ) : null}
          <View style={styles.pinBlock}>
            <View style={styles.pinPrompt}>
              <SymbolView
                tintColor={colors.textSecondary}
                name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                size={14}
              />
              <Text style={[styles.body, { color: colors.textSecondary }]}>
                Tap to enter your transaction PIN
              </Text>
            </View>
            <PinInput
              inputRef={inputRef}
              value={flow.pin}
              onChange={flow.setPin}
              onSubmit={onPay}
              disabled={flow.isPaying}
              error={pinError}
            />
          </View>
          {flow.payError ? (
            <Text accessibilityRole="alert" style={[styles.error, styles.center, { color: colors.danger }]}>
              {errorMessage(flow.payError)}
            </Text>
          ) : null}
          {flow.networkMismatch ? (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.body, { color: colors.text }]}>
                If this number was moved to another network, you can buy anyway. Check the number
                carefully before you continue.
              </Text>
              <Button
                label="Buy anyway"
                variant="secondary"
                onPress={flow.overrideNetworkCheck}
                disabled={flow.isPaying}
              />
            </View>
          ) : null}
          <Button
            label={payLabel}
            onPress={onPay}
            loading={flow.isPaying}
            disabled={flow.pin.length !== 4}
          />
        </>
      )}

      {flow.unknown || flow.isPaying ? null : (
        <Button label="Edit details" variant="secondary" onPress={onEdit} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 2, paddingVertical: 8 },
  heroLabel: { fontSize: fontSize.base },
  payLabel: { marginTop: 12 },
  recipient: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  amount: { fontSize: 34, fontWeight: '700', fontVariant: ['tabular-nums'] },
  card: { borderRadius: radius + 4, borderWidth: 1, padding: 16, gap: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pinBlock: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  pinPrompt: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  body: { fontSize: fontSize.base + 1, lineHeight: 22 },
  note: { fontSize: fontSize.sm + 1, lineHeight: 18 },
  error: { fontSize: fontSize.base, fontWeight: '600' },
});
