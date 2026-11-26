// src/app/login.tsx

import * as AuthSession from 'expo-auth-session';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/auth/session';

const issuer = process.env.EXPO_PUBLIC_SPURS_ISSUER ?? '';
const clientId = process.env.EXPO_PUBLIC_SPURS_CLIENT_ID ?? '';

export default function LoginScreen() {
  const router = useRouter();
  const { isSignedIn, isLoading, signIn } = useSession();
  const discovery = AuthSession.useAutoDiscovery(issuer || null);
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'vtuapp', path: 'login' });
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
        router.replace('/');
      } catch (exchangeError) {
        setError(exchangeError instanceof Error ? exchangeError.message : 'Sign-in failed.');
      }
    })();
  }, [response, request, discovery, redirectUri, router]);

  if (isLoading) return <View style={styles.center}><ActivityIndicator /></View>;
  if (isSignedIn) return <Redirect href="/" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spur VTU</Text>
      <Text style={styles.subtitle}>Sign in to manage and purchase VTU services.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        accessibilityLabel="Sign in with Spurs"
        disabled={!request || !clientId}
        onPress={() => void promptAsync()}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>Sign in with Spurs</Text>
      </Pressable>
      {!clientId ? <Text style={styles.error}>Mobile sign-in is not configured.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#EEF3F4' },
  title: { color: '#12343B', fontSize: 32, fontWeight: '700' },
  subtitle: { color: '#60757A', marginTop: 8, marginBottom: 24, textAlign: 'center' },
  error: { color: '#C8432B', marginBottom: 16, textAlign: 'center' },
  button: { minHeight: 52, minWidth: 220, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#F2B632', paddingHorizontal: 24 },
  buttonText: { color: '#12343B', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
