import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';

import { getTransactionStatus } from '@/api/endpoints';
import { isApiError, isNetworkMismatch, isOutcomeUnknown } from '@/api/errors';
import { reportError } from '@/lib/report-error';
import type { PurchaseResult, TxStatus } from '@/api/types';
import {
  addPending,
  PendingPurchaseStoreError,
  removePending,
} from '@/purchases/pending-store';

const POLL_MS = 5_000;
const POLL_WINDOW_MS = 120_000;

export type FlowResult = {
  status: TxStatus;
  message: string;
  failureReason?: string | null;
};

type PurchaseBody = { reference: string; pin: string; skipNetworkCheck?: boolean };

export type PurchaseFlowView = {
  reference: string | null;
  pin: string;
  setPin: (value: string) => void;
  showPinError: boolean;
  notice: string | null;
  unknown: boolean;
  isPaying: boolean;
  payError: Error | null;
  networkMismatch: boolean;
  overrideNetworkCheck: () => void;
  checking: boolean;
  checkError: Error | null;
  checkStatus: () => void;
  result: FlowResult | null;
  liveStatus: TxStatus | undefined;
  failureReason: string | null;
  pollExpired: boolean;
};

export type PurchaseFlow<TBody extends PurchaseBody> = PurchaseFlowView & {
  begin: () => void;
  back: () => void;
  finish: () => void;
  pay: (build: (reference: string, pin: string) => TBody) => void;
};

export function usePurchaseFlow<TBody extends PurchaseBody>(
  submit: (body: TBody) => Promise<PurchaseResult>,
): PurchaseFlow<TBody> {
  const queryClient = useQueryClient();
  const [reference, setReference] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [showPinError, setShowPinError] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [unknown, setUnknown] = useState(false);
  const [result, setResult] = useState<FlowResult | null>(null);
  const [pollExpired, setPollExpired] = useState(false);
  const [skipNetworkCheck, setSkipNetworkCheck] = useState(false);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['balance'] });
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    void queryClient.invalidateQueries({ queryKey: ['me'] });
  }

  function removeTrackedPurchase(ref: string, message: string) {
    void removePending(ref).catch(() => {
      reportError({ source: 'purchase_tracking.remove' });
      setNotice(message);
    });
  }

  const buy = useMutation({
    mutationFn: async (body: TBody) => {
      await addPending(body.reference);
      return submit(body);
    },
    onSuccess: (data, variables) => {
      setResult({ status: data.status, message: data.message });
      if (data.status === 'success') {
        removeTrackedPurchase(
          variables.reference,
          'Your purchase completed, but its local status could not be cleared. Check History.',
        );
      }
      refresh();
    },
    onError: (error, variables) => {
      if (error instanceof PendingPurchaseStoreError) {
        setNotice(error.message);
      } else if (isOutcomeUnknown(error)) {
        setUnknown(true);
      } else {
        removeTrackedPurchase(
          variables.reference,
          'The response is clear, but local purchase tracking could not be updated. Check History.',
        );
      }
    },
  });

  const check = useMutation({
    mutationFn: (ref: string) => getTransactionStatus(ref),
    onSuccess: (data, ref) => {
      setUnknown(false);
      setResult({
        status: data.status,
        message: 'Your purchase was received.',
        failureReason: data.failureReason,
      });
      if (data.status !== 'pending') {
        removeTrackedPurchase(
          ref,
          'The order status is known, but local purchase tracking could not be cleared.',
        );
      }
      refresh();
    },
    onError: (error, ref) => {
      if (isApiError(error) && error.code === 'not_found') {
        setUnknown(false);
        buy.reset();
        removeTrackedPurchase(
          ref,
          "That attempt wasn't found, but local purchase tracking could not be cleared.",
        );
        setNotice("That attempt didn't go through and you were not charged. Enter your PIN to try again.");
      }
    },
  });

  const purchasePending = result?.status === 'pending';
  const order = useQuery({
    queryKey: ['order', reference],
    queryFn: () => getTransactionStatus(reference as string),
    enabled: purchasePending && !!reference,
    staleTime: 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if ((status && status !== 'pending') || pollExpired) return false;
      return POLL_MS;
    },
  });

  const liveStatus: TxStatus | undefined = order.data?.status ?? result?.status;
  const pending = liveStatus === 'pending';
  const failureReason = order.data?.failureReason ?? result?.failureReason ?? null;

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setPollExpired(true), POLL_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  useEffect(() => {
    if (purchasePending && liveStatus && liveStatus !== 'pending') {
      refresh();
      if (reference) {
        void removePending(reference).catch(() => {
          reportError({ source: 'purchase_tracking.remove' });
          setNotice('The order status is known, but local purchase tracking could not be cleared.');
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveStatus, purchasePending]);

  function clearAttempt() {
    setReference(null);
    setPin('');
    setShowPinError(false);
    setNotice(null);
    setUnknown(false);
    setSkipNetworkCheck(false);
    buy.reset();
    check.reset();
  }

  function begin() {
    clearAttempt();
    setResult(null);
    setPollExpired(false);
    setReference(Crypto.randomUUID());
  }

  function back() {
    if (buy.isPending) return;
    clearAttempt();
  }

  function finish() {
    clearAttempt();
    setResult(null);
    setPollExpired(false);
  }

  function pay(build: (reference: string, pin: string) => TBody) {
    if (buy.isPending || !reference) return;
    if (!/^\d{4}$/.test(pin)) {
      setShowPinError(true);
      return;
    }
    const built = build(reference, pin);
    const body = skipNetworkCheck ? { ...built, skipNetworkCheck: true } : built;
    setPin('');
    setShowPinError(false);
    setNotice(null);
    buy.mutate(body);
  }

  function overrideNetworkCheck() {
    if (buy.isPending) return;
    if (reference) {
      removeTrackedPurchase(
        reference,
        'We could not update the previous attempt. Check History before trying again.',
      );
    }
    buy.reset();
    setPin('');
    setShowPinError(false);
    setSkipNetworkCheck(true);
    setReference(Crypto.randomUUID());
    setNotice('Enter your PIN to buy anyway.');
  }

  function checkStatus() {
    if (reference && !check.isPending) check.mutate(reference);
  }

  const checkError =
    check.isError && !(isApiError(check.error) && check.error.code === 'not_found')
      ? check.error
      : null;
  const payError =
    buy.isError && !unknown && !(buy.error instanceof PendingPurchaseStoreError)
      ? buy.error
      : null;

  return {
    reference,
    pin,
    setPin,
    showPinError,
    notice,
    unknown,
    isPaying: buy.isPending,
    payError,
    networkMismatch: isNetworkMismatch(payError),
    overrideNetworkCheck,
    checking: check.isPending,
    checkError,
    checkStatus,
    result,
    liveStatus,
    failureReason,
    pollExpired,
    begin,
    back,
    finish,
    pay,
  };
}
