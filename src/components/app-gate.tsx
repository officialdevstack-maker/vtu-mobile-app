import type { ReactNode } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StateView } from '@/components/state-view';
import { MaxContentWidth } from '@/constants/theme';
import { useAppGate } from '@/hooks/use-app-gate';
import { useColors } from '@/theme';

const STORE_URL = Platform.select({
  ios: process.env.EXPO_PUBLIC_IOS_STORE_URL,
  android: process.env.EXPO_PUBLIC_ANDROID_STORE_URL,
  default: undefined,
});

export function AppGate({ children }: { children: ReactNode }) {
  const colors = useColors();
  const { gate, refetch, isRefetching } = useAppGate();

  if (gate.status === 'ok') return <>{children}</>;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {gate.status === 'maintenance' ? (
          <StateView
            icon={{ ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' }}
            title="We'll be right back"
            message={gate.message ?? 'Spur VTU is down for maintenance. Please try again shortly.'}
            actionLabel="Check again"
            onAction={() => void refetch()}
            actionLoading={isRefetching}
          />
        ) : (
          <StateView
            icon={{ ios: 'arrow.down.circle.fill', android: 'system_update', web: 'system_update' }}
            title="Update required"
            message={`This version of Spur VTU is no longer supported. Please update to version ${gate.minimumVersion} or newer to continue.`}
            actionLabel={STORE_URL ? 'Update app' : undefined}
            onAction={STORE_URL ? () => void Linking.openURL(STORE_URL) : undefined}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    justifyContent: 'center',
    padding: 16,
  },
});
