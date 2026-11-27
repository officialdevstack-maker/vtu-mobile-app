import { QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, useColorScheme } from 'react-native';

import { NetworkBanner } from '@/components/network-banner';
import { SplashOverlay } from '@/components/splash-overlay';
import { StateView } from '@/components/state-view';
import { AppGate } from '@/components/app-gate';
import { SessionProvider, useSession } from '@/auth/session';
import { queryClient } from '@/api/query-client';
import { usePendingReconciler } from '@/hooks/use-pending-reconciler';
import { loadOnboarding, useOnboarding } from '@/onboarding/store';
import { useColors } from '@/theme';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

function redactSensitiveText(value: string): string {
  return value
    .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\+?234[\s-]?\d{10}\b|\b0\d{10}\b/g, '[phone]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[token]')
    .replace(/\bsntrys_[A-Za-z0-9_+/.=-]+/gi, '[token]');
}

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    maxBreadcrumbs: 0,
    beforeSend(event) {
      event.user = undefined;
      event.request = undefined;
      event.breadcrumbs = undefined;
      event.extra = undefined;
      event.transaction = undefined;
      if (event.message) event.message = redactSensitiveText(event.message);
      if (event.logentry?.message) {
        event.logentry.message = redactSensitiveText(event.logentry.message);
      }
      for (const exception of event.exception?.values ?? []) {
        if (exception.value) exception.value = redactSensitiveText(exception.value);
      }
      return event;
    },
  });
}

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLoading, isSignedIn } = useSession();
  const onboarding = useOnboarding();
  const colors = useColors();
  const pendingRecovery = usePendingReconciler(isSignedIn);

  useEffect(() => {
    void loadOnboarding();
  }, []);

  if (isLoading || !onboarding.loaded) return null;

  const headerOptions = {
    headerShown: true,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '700' as const },
    contentStyle: { backgroundColor: colors.background },
  } as const;

  return (
    <View style={{ flex: 1 }}>
      <NetworkBanner />
      {pendingRecovery.hasError ? (
        <StateView
          compact
          alert
          tone="danger"
          icon={{ ios: 'clock.badge.exclamationmark', android: 'error', web: 'error' }}
          title="Purchase status unavailable"
          message="We couldn't check the status of an unfinished purchase. Check your connection and try again."
          actionLabel="Check again"
          onAction={() => void pendingRecovery.refetch()}
          actionLoading={pendingRecovery.isFetching}
        />
      ) : null}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="buy/airtime" options={{ ...headerOptions, title: 'Buy airtime' }} />
          <Stack.Screen name="buy/data" options={{ ...headerOptions, title: 'Buy data' }} />
          <Stack.Screen name="buy/cable" options={{ ...headerOptions, title: 'Cable TV' }} />
          <Stack.Screen name="buy/electricity" options={{ ...headerOptions, title: 'Electricity' }} />
          <Stack.Screen name="order/[reference]" options={{ ...headerOptions, title: 'Order' }} />
          <Stack.Screen name="fund" options={{ ...headerOptions, title: 'Add money' }} />
          <Stack.Screen name="notifications" options={{ ...headerOptions, title: 'Notifications' }} />
          <Stack.Screen name="help" options={{ ...headerOptions, title: 'Help' }} />
          <Stack.Screen name="cashback" options={{ ...headerOptions, title: 'Cashback' }} />
          <Stack.Screen name="referrals" options={{ ...headerOptions, title: 'Referrals' }} />
          <Stack.Screen name="pin" options={{ ...headerOptions, title: 'Transaction PIN' }} />
          <Stack.Screen name="packages" options={{ ...headerOptions, title: 'Packages' }} />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn && !onboarding.seen}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn && onboarding.seen}>
          <Stack.Screen name="(auth)/login" />
        </Stack.Protected>
      </Stack>
    </View>
  );
}

function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <SplashOverlay />
          <AppGate>
            <RootNavigator />
          </AppGate>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
