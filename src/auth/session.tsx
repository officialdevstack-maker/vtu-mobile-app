// src/auth/session.tsx

import * as AuthSession from 'expo-auth-session';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { configureApiClient } from '@/api/client';
import { queryClient } from '@/api/query-client';
import { reportError } from '@/lib/report-error';
import { SPURS_CLIENT_ID, SPURS_ISSUER } from './config';
import { clearTokens, loadTokens, saveTokens } from './storage';

type SessionContextValue = {
  isLoading: boolean;
  isSignedIn: boolean;
  accessToken: string | null;
  signIn: (accessToken: string, refreshToken?: string | null) => Promise<void>;
  signOut: () => Promise<void>;
};

type TokenPair = { access: string | null; refresh: string | null };

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const tokens = useRef<TokenPair>({ access: null, refresh: null });

  const signIn = useCallback(async (nextAccessToken: string, nextRefreshToken?: string | null) => {
    tokens.current = { access: nextAccessToken, refresh: nextRefreshToken ?? null };
    await saveTokens({ accessToken: nextAccessToken, refreshToken: nextRefreshToken ?? null });
    setAccessToken(nextAccessToken);
  }, []);

  const signOut = useCallback(async () => {
    tokens.current = { access: null, refresh: null };
    await clearTokens();
    queryClient.clear();
    setAccessToken(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    void loadTokens()
      .then((session) => {
        if (!mounted) return;
        tokens.current = {
          access: session?.accessToken ?? null,
          refresh: session?.refreshToken ?? null,
        };
        setAccessToken(session?.accessToken ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        reportError({ source: 'auth.session_restore' });
        if (!mounted) return;
        tokens.current = { access: null, refresh: null };
        setAccessToken(null);
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    configureApiClient({
      getAccessToken: () => Promise.resolve(tokens.current.access),
      refresh: async () => {
        const refreshToken = tokens.current.refresh;
        if (!refreshToken) {
          reportError({ source: 'auth.no_refresh_token' });
          return null;
        }
        if (!SPURS_CLIENT_ID) {
          reportError({ source: 'auth.client_id_missing' });
          return null;
        }
        const discovery = await AuthSession.fetchDiscoveryAsync(SPURS_ISSUER);
        if (!discovery.tokenEndpoint) return null;
        let response: AuthSession.TokenResponse;
        try {
          response = await AuthSession.refreshAsync(
            { clientId: SPURS_CLIENT_ID, refreshToken },
            discovery,
          );
        } catch (error) {
          if (error instanceof AuthSession.TokenError) {
            reportError({ source: 'auth.refresh_rejected' });
            return null;
          }
          throw error;
        }
        if (!response.accessToken) return null;
        const nextRefreshToken = response.refreshToken ?? refreshToken;
        tokens.current = { access: response.accessToken, refresh: nextRefreshToken };
        await saveTokens({
          accessToken: response.accessToken,
          refreshToken: nextRefreshToken,
        });
        setAccessToken(response.accessToken);
        return response.accessToken;
      },
      onSignedOut: () => {
        void signOut();
      },
    });
  }, [signOut]);

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
