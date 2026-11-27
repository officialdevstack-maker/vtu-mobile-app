import {
  NetInfoCellularGeneration,
  useNetInfo,
} from '@react-native-community/netinfo';

export type NetworkStatus = {
  isOffline: boolean;
  isSlow: boolean;
};

export function useNetworkStatus(): NetworkStatus {
  const info = useNetInfo();
  const isOffline = info.isConnected === false || info.isInternetReachable === false;
  const isSlow =
    !isOffline &&
    info.type === 'cellular' &&
    info.details.cellularGeneration === NetInfoCellularGeneration['2g'];

  return { isOffline, isSlow };
}
