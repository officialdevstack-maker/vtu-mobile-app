// src/components/account-card.tsx

import * as Clipboard from 'expo-clipboard';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FundingAccount } from '@/api/types';
import { MIN_TOUCH, radius, useColors } from '@/theme';

type AccountCardProps = {
  title: string;
  account: FundingAccount;
  children?: ReactNode;
};

export function AccountCard({ title, account, children }: AccountCardProps) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    await Clipboard.setStringAsync(account.accountNumber);
    setCopied(true);
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
      <View style={styles.numberRow}>
        <View accessible accessibilityLabel={`Account number ${account.accountNumber.split('').join(' ')}`}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Account number</Text>
          <Text style={[styles.number, { color: colors.text }]}>{account.accountNumber}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copied ? 'Account number copied' : 'Copy account number'}
          onPress={() => void copy()}
          style={({ pressed }) => [
            styles.copy,
            { borderColor: colors.border, backgroundColor: colors.background },
            pressed && styles.pressed,
          ]}>
          <SymbolView
            tintColor={copied ? colors.success : colors.text}
            name={
              copied
                ? { ios: 'checkmark', android: 'check', web: 'check' }
                : { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }
            }
            size={16}
          />
          <Text style={[styles.copyText, { color: copied ? colors.success : colors.text }]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </Pressable>
      </View>
      <View style={styles.detail}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Bank</Text>
        <Text style={[styles.value, { color: colors.text }]}>{account.bankName}</Text>
      </View>
      <View style={styles.detail}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Account name</Text>
        <Text style={[styles.value, { color: colors.text }]}>{account.accountName}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  title: { fontSize: 16, fontWeight: '700' },
  numberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 13 },
  number: { fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: 1 },
  copy: {
    minHeight: MIN_TOUCH,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  copyText: { fontSize: 14, fontWeight: '700' },
  detail: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  value: { fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  pressed: { opacity: 0.85 },
});
