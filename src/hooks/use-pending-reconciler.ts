import { useQuery, useQueryClient } from '@tanstack/react-query';

import { reconcilePending } from '@/purchases/reconcile';

const RECHECK_MS = 20_000;

export function usePendingReconciler(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['pending-purchases'],
    enabled,
    staleTime: 0,
    retry: false,
    queryFn: async () => {
      const result = await reconcilePending();
      if (result.settled > 0) {
        void queryClient.invalidateQueries({ queryKey: ['balance'] });
        void queryClient.invalidateQueries({ queryKey: ['transactions'] });
        void queryClient.invalidateQueries({ queryKey: ['me'] });
      }
      return result;
    },
    refetchInterval: (current) => {
      const data = current.state.data;
      if ((data?.remaining ?? 0) === 0) return false;
      return Math.max(RECHECK_MS, data?.retryAfterMs ?? 0);
    },
  });

  return {
    hasError: query.isError || query.data?.hasTransientError === true,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
