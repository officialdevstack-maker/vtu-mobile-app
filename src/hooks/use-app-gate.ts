import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';

import { getConfig } from '@/api/endpoints';
import { isOlderVersion } from '@/lib/version';

export type AppGateState =
  | { status: 'ok' }
  | { status: 'maintenance'; message: string | null }
  | { status: 'update_required'; minimumVersion: string };

const NORMAL_REFRESH_MS = 5 * 60_000;
const MAINTENANCE_REFRESH_MS = 30_000;

export function useAppGate() {
  const query = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
    staleTime: 60_000,
    retry: 1,
    refetchInterval: (q) =>
      q.state.data?.maintenance ? MAINTENANCE_REFRESH_MS : NORMAL_REFRESH_MS,
  });

  const version = Constants.expoConfig?.version ?? '0.0.0';
  const config = query.data;
  let gate: AppGateState = { status: 'ok' };

  if (config?.maintenance) {
    gate = { status: 'maintenance', message: config.maintenanceMessage };
  } else if (config?.minimumVersion && isOlderVersion(version, config.minimumVersion)) {
    gate = { status: 'update_required', minimumVersion: config.minimumVersion };
  }

  return { gate, refetch: query.refetch, isRefetching: query.isRefetching };
}
