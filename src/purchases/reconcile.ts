import { getTransactionStatus } from '@/api/endpoints';
import { isApiError, isOutcomeUnknown } from '@/api/errors';
import type { TransactionStatus } from '@/api/types';

import { listPending, removePending } from './pending-store';

const NOT_FOUND_GRACE_MS = 2 * 60 * 1000;

export type ReconcileResult = {
  remaining: number;
  settled: number;
  hasTransientError: boolean;
  retryAfterMs: number;
};

export async function reconcilePending(): Promise<ReconcileResult> {
  const items = await listPending();
  let settled = 0;
  let remaining = 0;
  let hasTransientError = false;
  let retryAfterMs = 0;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!item) continue;

    let status: TransactionStatus;
    try {
      status = await getTransactionStatus(item.reference);
    } catch (error) {
      if (isApiError(error) && error.code === 'not_found') {
        if (Date.now() - item.startedAt > NOT_FOUND_GRACE_MS) {
          await removePending(item.reference);
          settled += 1;
        } else {
          remaining += 1;
        }
      } else if (isApiError(error) && error.code === 'rate_limited') {
        remaining += items.length - index;
        hasTransientError = true;
        retryAfterMs = Math.max(
          retryAfterMs,
          (error.retryAfterSeconds ?? 60) * 1000,
        );
        break;
      } else if (isApiError(error) && (isOutcomeUnknown(error) || error.code === 'unavailable')) {
        remaining += 1;
        hasTransientError = true;
      } else {
        throw error;
      }
      continue;
    }

    if (status.status === 'pending') {
      remaining += 1;
    } else {
      await removePending(item.reference);
      settled += 1;
    }
  }

  return { remaining, settled, hasTransientError, retryAfterMs };
}
