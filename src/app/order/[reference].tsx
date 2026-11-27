import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTransactions, getTransactionStatus, isLookupReference } from '@/api/endpoints';
import { errorMessage } from '@/api/errors';
import { isMockMode } from '@/api/mock-mode';
import { shareReceipt } from '@/api/receipts';
import type { TxService, TxStatus } from '@/api/types';
import { Button } from '@/components/button';
import { STATUS_LABEL } from '@/components/order-row';
import { MaxContentWidth } from '@/constants/theme';
import { findCachedTransaction } from '@/lib/find-transaction';
import { formatLagosDate, formatNaira } from '@/lib/format';
import { SERVICE_ICON } from '@/lib/service-icons';
import { MIN_TOUCH, fontSize, radius, useColors } from '@/theme';

const POLL_MS = 5_000;
const POLL_WINDOW_MS = 120_000;

const SERVICE_LABEL: Record<TxService, string> = {
  airtime: 'Airtime',
  data: 'Data',
  cable: 'Cable TV',
  electricity: 'Electricity',
  wallet: 'Wallet',
};

const STATE_ICON = {
  done: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  current: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  failed: { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' },
  todo: { ios: 'circle', android: 'radio_button_unchecked', web: 'radio_button_unchecked' },
} as const;

type StepState = keyof typeof STATE_ICON;
type Step = { label: string; state: StepState; time?: string };

const STATE_WORD: Record<StepState, string> = {
  done: 'done',
  current: 'in progress',
  failed: 'failed',
  todo: 'not yet',
};

const STATUS_STATE: Record<TxStatus, StepState> = {
  success: 'done',
  pending: 'current',
  failed: 'failed',
};

function stepsFor(status: TxStatus, at: string, refunded: boolean): Step[] {
  const placed: Step = { label: 'Order placed', state: 'done', time: formatLagosDate(at) };
  if (status === 'success') {
    return [
      placed,
      { label: 'Confirmed by provider', state: 'done' },
      { label: 'Completed', state: 'done' },
    ];
  }
  if (status === 'failed') {
    return [
      placed,
      { label: 'Purchase failed', state: 'failed' },
      {
        label: refunded ? 'Refunded to wallet' : 'Refund, if charged',
        state: refunded ? 'done' : 'todo',
      },
    ];
  }
  return [
    placed,
    { label: 'Being confirmed', state: 'current' },
    { label: 'Completed', state: 'todo' },
  ];
}

export default function OrderScreen() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { reference } = useLocalSearchParams<{ reference: string }>();
  const [pollExpired, setPollExpired] = useState(false);

  const item = findCachedTransaction(queryClient, reference);
  const recent = useQuery({
    queryKey: ['transactions', { page: 1 }],
    queryFn: () => getTransactions({ page: 1 }),
    enabled: !item,
  });

  const canLookup =
    isMockMode || isLookupReference(reference) || reference.startsWith('flw-');
  const lookup = useQuery({
    queryKey: ['order', reference],
    queryFn: () => getTransactionStatus(reference),
    enabled: canLookup,
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' && !pollExpired ? POLL_MS : false,
  });

  const liveStatus: TxStatus | undefined = lookup.data?.status ?? item?.status;
  const settled = lookup.data?.status;
  const listed = item?.status;

  useEffect(() => {
    if (liveStatus !== 'pending') return;
    const timer = setTimeout(() => setPollExpired(true), POLL_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [liveStatus]);

  useEffect(() => {
    if (settled && settled !== 'pending' && listed === 'pending') {
      void queryClient.invalidateQueries({ queryKey: ['balance'] });
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    }
  }, [settled, listed, queryClient]);

  const share = useMutation({
    mutationFn: async () => {
      const receipt = await shareReceipt(reference);
      await Share.share({ message: `My Spur VTU receipt: ${receipt.page}` });
    },
  });

  const title = item?.title ?? lookup.data?.title ?? 'Order';
  const failureReason = lookup.data?.failureReason ?? item?.failureReason ?? null;
  const credit = item?.direction === 'credit';
  const canShare =
    !!item && item.service !== 'wallet' && item.direction === 'debit' && liveStatus === 'success';

  function reportIssue() {
    router.push({
      pathname: '/help',
      params: {
        subject: title,
        ...(isLookupReference(reference) ? { transactionId: reference } : {}),
      },
    });
  }

  let body: ReactNode;
  if (!liveStatus) {
    const loading = recent.isLoading || lookup.isLoading;
    body = loading ? (
      <ActivityIndicator color={colors.text} style={styles.state} />
    ) : (
      <View style={[styles.state, styles.gap]}>
        <Text accessibilityRole="alert" style={[styles.error, styles.center, { color: colors.danger }]}>
          {lookup.isError || recent.isError
            ? errorMessage(lookup.error ?? recent.error)
            : 'We could not find this order.'}
        </Text>
        <Button
          label="Try again"
          variant="secondary"
          onPress={() => {
            void recent.refetch();
            if (canLookup) void lookup.refetch();
          }}
        />
      </View>
    );
  } else {
    const tint =
      liveStatus === 'success'
        ? colors.success
        : liveStatus === 'failed'
          ? colors.danger
          : colors.textSecondary;

    body = (
      <>
        <View
          accessible
          accessibilityLabel={`${title}, ${item ? `${credit ? 'plus' : 'minus'} ${formatNaira(item.amount)}, ` : ''}${STATUS_LABEL[liveStatus]}`}
          style={[styles.card, styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {item ? (
            <View style={[styles.heroIcon, { backgroundColor: colors.background }]}>
              <SymbolView
                tintColor={credit ? colors.success : colors.text}
                name={SERVICE_ICON[item.service]}
                size={24}
              />
            </View>
          ) : null}
          <Text style={[styles.heroTitle, { color: colors.textSecondary }]} numberOfLines={2}>
            {title}
          </Text>
          {item ? (
            <Text style={[styles.heroAmount, { color: credit ? colors.success : colors.text }]}>
              {credit ? '+' : '-'}
              {formatNaira(item.amount)}
            </Text>
          ) : null}
          <View style={[styles.pill, { backgroundColor: `${tint}1F` }]}>
            <SymbolView tintColor={tint} name={STATE_ICON[STATUS_STATE[liveStatus]]} size={14} />
            <Text style={[styles.pillText, { color: tint }]}>{STATUS_LABEL[liveStatus]}</Text>
          </View>
        </View>

        {liveStatus === 'pending' ? (
          <Text accessibilityLiveRegion="polite" style={[styles.body, styles.center, { color: colors.textSecondary }]}>
            {pollExpired
              ? 'Still being confirmed. Pull down to check again; it also updates on its own.'
              : 'Your money is held while we confirm. This updates on its own.'}
          </Text>
        ) : null}

        {liveStatus === 'failed' ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
              {failureReason ?? 'The purchase could not be completed.'}
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              {item?.refunded
                ? 'Your money was refunded to your wallet.'
                : 'Any money taken is refunded automatically.'}
            </Text>
          </View>
        ) : null}

        {item && item.service !== 'wallet' ? (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.text }]}>
              Progress
            </Text>
            <View>
              {stepsFor(liveStatus, item.at, item.refunded === true).map((step, index, all) => (
                <TrackerStep key={step.label} step={step} last={index === all.length - 1} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.cardTitle, { color: colors.text }]}>
            Details
          </Text>
          <DetailRow label="Status" value={STATUS_LABEL[liveStatus]} first />
          {item ? <DetailRow label="Type" value={SERVICE_LABEL[item.service]} /> : null}
          {item?.detail ? <DetailRow label="Recipient" value={item.detail} /> : null}
          {item ? <DetailRow label="Date" value={formatLagosDate(item.at)} /> : null}
          {item?.cashbackUsed && item.cashbackUsed > 0 ? (
            <DetailRow label="Cashback used" value={formatNaira(item.cashbackUsed)} />
          ) : null}
          {item?.refunded ? <DetailRow label="Refund" value="Refunded to your wallet" /> : null}
          <DetailRow label="Reference" value={reference} copyable />
        </View>

        {share.isError ? (
          <Text accessibilityRole="alert" style={[styles.error, styles.center, { color: colors.danger }]}>
            {errorMessage(share.error)}
          </Text>
        ) : null}
        {canShare ? (
          <Button label="Share receipt" onPress={() => share.mutate()} loading={share.isPending} />
        ) : null}
        <Button label="Report issue" variant="secondary" onPress={reportIssue} />
      </>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={lookup.isRefetching || recent.isRefetching}
            onRefresh={() => {
              void recent.refetch();
              if (canLookup) void lookup.refetch();
            }}
          />
        }>
        <View style={styles.content}>{body}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TrackerStep({ step, last }: { step: Step; last: boolean }) {
  const colors = useColors();
  const tint =
    step.state === 'done'
      ? colors.success
      : step.state === 'failed'
        ? colors.danger
        : step.state === 'current'
          ? colors.text
          : colors.textSecondary;

  return (
    <View
      accessible
      accessibilityLabel={`${step.label}, ${STATE_WORD[step.state]}${step.time ? `, ${step.time}` : ''}`}
      style={styles.step}>
      <View style={styles.rail}>
        <SymbolView tintColor={tint} name={STATE_ICON[step.state]} size={20} />
        {last ? null : (
          <View
            style={[
              styles.line,
              { backgroundColor: step.state === 'done' ? colors.success : colors.border },
            ]}
          />
        )}
      </View>
      <View style={[styles.stepText, !last && styles.stepGap]}>
        <Text style={[styles.stepLabel, { color: step.state === 'todo' ? colors.textSecondary : colors.text }]}>
          {step.label}
        </Text>
        {step.time ? <Text style={[styles.note, { color: colors.textSecondary }]}>{step.time}</Text> : null}
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  copyable = false,
  first = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  first?: boolean;
}) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyValue() {
    try {
      await Clipboard.setStringAsync(value);
      setCopyError(false);
      setCopied(true);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <View
      accessible={!copyable}
      accessibilityLabel={copyable ? undefined : `${label}: ${value}`}
      style={[
        styles.detailRow,
        !first && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth },
      ]}>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.detailValueWrap}>
        <View style={styles.detailValueLine}>
          <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
          {copyable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
              hitSlop={8}
              onPress={() => void copyValue()}
              style={styles.copy}>
              <SymbolView
                tintColor={copied ? colors.success : colors.text}
                name={
                  copied
                    ? { ios: 'checkmark', android: 'check', web: 'check' }
                    : { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' }
                }
                size={16}
              />
            </Pressable>
          ) : null}
        </View>
        {copyError ? (
          <Text accessibilityRole="alert" style={[styles.copyError, { color: colors.danger }]}>
            Could not copy. Try again.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { alignItems: 'center', padding: 16 },
  content: { width: '100%', maxWidth: MaxContentWidth, gap: 16 },
  state: { paddingVertical: 24 },
  gap: { gap: 12 },
  center: { textAlign: 'center' },
  body: { fontSize: fontSize.base + 1, lineHeight: 22 },
  note: { fontSize: fontSize.sm + 1, lineHeight: 18 },
  error: { fontSize: fontSize.base, fontWeight: '600' },
  card: { borderRadius: radius + 4, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700' },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  heroIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: fontSize.md, fontWeight: '600', textAlign: 'center' },
  heroAmount: { fontSize: 34, fontWeight: '700', fontVariant: ['tabular-nums'] },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillText: { fontSize: fontSize.base, fontWeight: '700' },
  step: { flexDirection: 'row', gap: 12 },
  rail: { width: 22, alignItems: 'center' },
  line: { flex: 1, width: 2, minHeight: 14, marginVertical: 2 },
  stepText: { flex: 1, gap: 2 },
  stepGap: { paddingBottom: 14 },
  stepLabel: { fontSize: fontSize.base + 1, fontWeight: '600' },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 44,
    paddingTop: 10,
  },
  detailValueWrap: { flex: 1, flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  detailValueLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  detailValue: { flexShrink: 1, textAlign: 'right', fontSize: fontSize.base + 1, fontWeight: '600' },
  copy: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  copyError: { fontSize: fontSize.sm, textAlign: 'right' },
});
