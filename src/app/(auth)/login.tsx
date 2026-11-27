// src/app/(auth)/login.tsx

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { Button } from '@/components/button';
import { MaxContentWidth } from '@/constants/theme';
import { reportError } from '@/lib/report-error';
import { radius, useColors } from '@/theme';

WebBrowser.maybeCompleteAuthSession();

const issuer =
  process.env.EXPO_PUBLIC_SPURS_ISSUER ??
  'https://node-accounts-backend.onrender.com/api/oidc';
const clientId = process.env.EXPO_PUBLIC_SPURS_CLIENT_ID ?? '';

export default function LoginScreen() {
  const colors = useColors();
  const { isLoading, signIn } = useSession();
  const discovery = AuthSession.useAutoDiscovery(issuer);
  const redirectUri =
    process.env.EXPO_PUBLIC_SPURS_REDIRECT_URI ??
    AuthSession.makeRedirectUri({ scheme: 'vtuapp', path: 'redirect' });
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      usePKCE: true,
    },
    discovery,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (response?.type !== 'success' || !request || !discovery) return;
    void (async () => {
      try {
        const code = response.params.code;
        const token = await AuthSession.exchangeCodeAsync(
          {
            clientId,
            code,
            redirectUri,
            extraParams: request.codeVerifier
              ? { code_verifier: request.codeVerifier }
              : undefined,
          },
          discovery,
        );
        if (!token.accessToken) throw new Error('Sign-in did not return an access token.');
        await signIn(token.accessToken, token.refreshToken);
      } catch (exchangeError) {
        reportError({ source: 'auth.sign_in' });
        setError(exchangeError instanceof Error ? exchangeError.message : 'Sign-in failed.');
      }
    })();
  }, [response, request, discovery, redirectUri, signIn]);

  if (isLoading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.mark, { backgroundColor: colors.primary }]}>
            <Text style={[styles.markText, { color: colors.onPrimary }]}>S</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Spur VTU</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Airtime, data, cable TV and electricity from one wallet.
          </Text>
        </View>
        <View style={styles.actions}>
          {error ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger, borderColor: colors.danger }]}>
              {error}
            </Text>
          ) : null}
          <Button
            label="Continue with Spurs"
            onPress={() => void promptAsync()}
            disabled={!request || !clientId}
            loading={!request}
            accessibilityLabel="Sign in with Spurs"
          />
          {!clientId ? (
            <Text style={[styles.error, { color: colors.danger }]}>Mobile sign-in is not configured.</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1, alignItems: 'center' },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontSize: 36, fontWeight: '700' },
  title: { fontSize: 34, fontWeight: '700' },
  subtitle: { fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 320 },
  actions: { gap: 12 },
  error: {
    borderWidth: 1,
    borderRadius: radius,
    padding: 12,
    fontSize: 14,
    fontWeight: '600',
  },
});
