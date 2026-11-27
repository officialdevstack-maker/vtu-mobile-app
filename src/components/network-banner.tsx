import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNetworkStatus } from '@/hooks/use-network-status';
import { fontSize, useColors } from '@/theme';

export function NetworkBanner() {
  const colors = useColors();
  const { isOffline, isSlow } = useNetworkStatus();

  if (!isOffline && !isSlow) return null;

  const message = isOffline
    ? 'No internet connection. Purchases are unavailable.'
    : 'Slow connection. Things may take longer than usual.';
  const background = isOffline ? colors.danger : colors.primary;
  const foreground = isOffline ? '#FFFFFF' : colors.onPrimary;

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: background }}>
      <View
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityLabel={message}
        style={styles.row}>
        <SymbolView
          tintColor={foreground}
          name={
            isOffline
              ? { ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' }
              : { ios: 'wifi.exclamationmark', android: 'network_check', web: 'network_check' }
          }
          size={14}
        />
        <Text style={[styles.text, { color: foreground }]}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: { fontSize: fontSize.sm + 1, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
});
