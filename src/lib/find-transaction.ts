import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { TransactionItem, TransactionPage } from '@/api/types';

type CachedTransactions = TransactionPage | InfiniteData<TransactionPage> | undefined;

export function findCachedTransaction(
  queryClient: QueryClient,
  reference: string,
): TransactionItem | undefined {
  for (const [, data] of queryClient.getQueriesData<CachedTransactions>({
    queryKey: ['transactions'],
  })) {
    if (!data) continue;
    const pages = 'pages' in data ? data.pages : [data];
    for (const page of pages) {
      const found = page.items.find((item) => item.reference === reference);
      if (found) return found;
    }
  }
  return undefined;
}
