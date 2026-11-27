// src/api/query-client.ts

import { focusManager, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { isApiError } from './errors';
import { reportError } from '@/lib/report-error';

if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener('change', (state) => {
      handleFocus(state === 'active');
    });
    return () => subscription.remove();
  });
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (!isApiError(error)) reportError({ source: 'query' });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (!isApiError(error)) reportError({ source: 'mutation' });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
        return failureCount < 2;
      },
    },
  },
});
