// src/auth/session.tsx

import * as AuthSession from 'expo-auth-session';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { configureApiClient } from '@/api/client';
import { clearTokens, loadTokens, saveTokens } from './storage';

type SessionContextValue = {
  isLoading: boolean;
  isSignedIn: boolean;
  accessToken: string | null;
  signIn: (accessToken: string, refreshToken?: string | null) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const signIn = useCallback(async (nextAccessToken: string, nextRefreshToken?: string | null) => {
    await saveTokens({ accessToken: nextAccessToken, refreshToken: nextRefreshToken ?? null });
    setAccessToken(nextAccessToken);
    setRefreshToken(nextRefreshToken ?? null);
  }, []);

  const signOut = useCallback(async () => {
    await clearTokens();
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    void loadTokens().then((session) => {
      if (!mounted) return;
      setAccessToken(session?.accessToken ?? null);
      setRefreshToken(session?.refreshToken ?? null);
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => Promise.resolve(accessToken),
      refresh: async () => {
        if (!refreshToken) return null;
        const issuer = process.env.EXPO_PUBLIC_SPURS_ISSUER;
        if (!issuer) return null;
        const discovery = await AuthSession.fetchDiscoveryAsync(issuer);
        if (!discovery.tokenEndpoint) return null;
        const clientId = process.env.EXPO_PUBLIC_SPURS_CLIENT_ID;
        if (!clientId) return null;
        const response = await AuthSession.refreshAsync(
          { clientId, refreshToken },
          discovery,
        );
        if (!response.accessToken) return null;
        await saveTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken ?? refreshToken,
        });
        setAccessToken(response.accessToken);
        setRefreshToken(response.refreshToken ?? refreshToken);
        return response.accessToken;
      },
      onSignedOut: () => {
        void signOut();
      },
    });
  }, [accessToken, refreshToken, signOut]);

  const value = useMemo<SessionContextValue>(
    () => ({
      isLoading,
      isSignedIn: accessToken !== null,
      accessToken,
      signIn,
      signOut,
    }),
    [isLoading, accessToken, signIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used within SessionProvider');
  return value;
}
