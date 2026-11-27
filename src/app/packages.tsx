import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPackages, upgradePackage } from '@/api/account';
import { getBalance, getMe } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { Button } from '@/components/button';
import { PinInput } from '@/components/pin-input';
import { EmptyState, ErrorState, LoadingState, SuccessState } from '@/components/states';
import { MaxContentWidth } from '@/constants/theme';
import { useSlowLoading } from '@/hooks/use-slow-loading';
import { formatNaira } from '@/lib/format';
import { MIN_TOUCH, fontSize, radius, useColors } from '@/theme';

export default function PackagesScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [showPinError, setShowPinError] = useState(false);

  const packages = useQuery({ queryKey: ['packages'], queryFn: getPackages });
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const balance = useQuery({ queryKey: ['balance'], queryFn: getBalance });
  const loading = packages.isLoading || me.isLoading || balance.isLoading;
  const slow = useSlowLoading(loading);

  function refresh() {
    void packages.refetch();
    void me.refetch();
    void balance.refetch();
  }

  const upgrade = useMutation({
    mutationFn: upgradePackage,
    onSuccess: () => {
      setSelectedId(null);
      for (const key of ['packages', 'catalog', 'balance', 'transactions', 'me']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
    onError: () => {
      void packages.refetch();
      void balance.refetch();
      void me.refetch();
    },
  });

  const items = useMemo(
    () => [...(packages.data?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [packages.data],
  );
  const current = items.find((item) => item.id === packages.data?.current);
  const selected = items.find((item) => item.id === selectedId);
  const missingPin = !!me.data && !me.data.hasPin;
  const lowBalance =
    !!selected &&
    selected.upgradeFee > 0 &&
    balance.data !== undefined &&
    selected.upgradeFee > balance.data.balance;

  function choose(id: string) {
    if (upgrade.isPending) return;
    setSelectedId((value) => (value === id ? null : id));
    setPin('');
    setShowPinError(false);
    upgrade.reset();
  }

  function submit() {
    if (!selected || upgrade.isPending) return;
    if (!/^\d{4}$/.test(pin)) {
      setShowPinError(true);
      return;
    }
    const input = { packageId: selected.id, pin };
    setPin('');
    setShowPinError(false);
    upgrade.mutate(input);
  }

  let body;
  if (upgrade.isSuccess) {
    body = (
      <SuccessState
        title="Package upgraded"
        message="Your prices now follow your new package."
        onAction={() => router.back()}
      />
    );
  } else if (loading) {
    body = <LoadingState slow={slow} />;
  } else if (
    packages.isError ||
    !packages.data ||
    me.isError ||
    !me.data ||
    balance.isError ||
    !balance.data
  ) {
    const error = packages.error ?? me.error ?? balance.error;
    body = <ErrorState error={error} onRetry={refresh} />;
  } else if (items.length === 0) {
    body = (
      <EmptyState
        title="No packages available"
        message="Packages are not available right now."
        actionLabel="Try again"
        onAction={refresh}
      />
    );
  } else {
    body = (
      <>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          You can move to a higher package. The upgrade fee, if any, is charged to your wallet.
        </Text>

        {items.map((item) => {
          const isCurrent = item.id === current?.id;
          const upgradable = !!current && item.sortOrder > current.sortOrder;
          const isSelected = item.id === selectedId;
          const fee = item.upgradeFee > 0 ? formatNaira(item.upgradeFee) : 'Free';
          const tag = isCurrent ? 'Current package' : upgradable ? fee : 'Lower than your package';

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}. ${item.description}. ${tag}`}
              accessibilityState={{ selected: isSelected, disabled: !upgradable }}
              disabled={!upgradable || upgrade.isPending}
              onPress={() => choose(item.id)}
              style={({ pressed }) => [
                styles.row,
                isSelected
                  ? { backgroundColor: `${colors.primary}26`, borderColor: colors.primary }
                  : {
                      backgroundColor: colors.surface,
                      borderColor: isCurrent ? colors.success : colors.border,
                    },
                !upgradable && !isCurrent && styles.muted,
                pressed && styles.pressed,
              ]}>
              <View style={styles.rowText}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                {item.description ? (
                  <Text style={[styles.note, { color: colors.textSecondary }]}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
              <Text
                style={[
                  styles.tag,
                  {
                    color: isCurrent
                      ? colors.success
                      : upgradable
                        ? colors.text
                        : colors.textSecondary,
                  },
                ]}>
                {tag}
              </Text>
            </Pressable>
          );
        })}

        {selected ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.text }]}>
              Upgrade to {selected.name}
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {selected.upgradeFee > 0
                ? `${formatNaira(selected.upgradeFee)} will be charged to your wallet.`
                : 'This upgrade is free.'}
            </Text>
            {lowBalance ? (
              <>
                <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
                  Your wallet balance is {formatNaira(balance.data.balance)}, which may not cover
                  this fee.
                </Text>
                <Button label="Add money" variant="secondary" onPress={() => router.push('/fund')} />
              </>
            ) : null}
            {missingPin ? (
              <>
                <Text style={[styles.body, { color: colors.text }]}>
                  You need a transaction PIN before you can upgrade.
                </Text>
                <Button label="Set your PIN" onPress={() => router.push('/pin')} />
              </>
            ) : (
              <>
                <Text style={[styles.body, styles.center, { color: colors.textSecondary }]}>
                  Enter your transaction PIN to confirm
                </Text>
                <PinInput
                  value={pin}
                  onChange={setPin}
                  onSubmit={submit}
                  disabled={upgrade.isPending}
                  error={showPinError && pin.length !== 4 ? 'Enter your 4-digit PIN.' : null}
                />
                {upgrade.isError ? (
                  <Text
                    accessibilityRole="alert"
                    style={[styles.error, styles.center, { color: colors.danger }]}>
                    {errorMessage(upgrade.error)}
                  </Text>
                ) : null}
                <Button
                  label={`Upgrade to ${selected.name}`}
                  onPress={submit}
                  loading={upgrade.isPending}
                  disabled={pin.length !== 4}
                />
              </>
            )}
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
        automaticallyAdjustKeyboardInsets
        refreshControl={
          <RefreshControl
            refreshing={packages.isRefetching || me.isRefetching || balance.isRefetching}
            onRefresh={refresh}
          />
        }>
        <View style={styles.content}>{body}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { alignItems: 'center', padding: 16 },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: 12 },
  center: { textAlign: 'center' },
  body: { fontSize: fontSize.base + 1, lineHeight: 22 },
  note: { fontSize: fontSize.sm + 1, lineHeight: 18 },
  error: { fontSize: fontSize.base, fontWeight: '600' },
  row: {
    minHeight: MIN_TOUCH + 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: radius,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.md, fontWeight: '700' },
  tag: {
    fontSize: fontSize.base,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
    flexShrink: 1,
  },
  muted: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
  card: { borderRadius: radius + 4, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700' },
});
