import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SessionProvider, useSession } from '@/auth/session';
import { queryClient } from '@/api/query-client';
import { useColors } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLoading, isSignedIn } = useSession();
  const colors = useColors();
  if (isLoading) return null;

  const headerOptions = {
    headerShown: true,
    headerShadowVisible: false,
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '700' as const },
    contentStyle: { backgroundColor: colors.background },
  } as const;

  return (
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
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)/login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
