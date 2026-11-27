import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

const KEY = 'spur_onboarding_seen';

export type OnboardingState = {
  loaded: boolean;
  seen: boolean;
  error: string | null;
};

let state: OnboardingState = { loaded: false, seen: false, error: null };
let started = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setState(next: OnboardingState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function loadOnboarding(): Promise<void> {
  if (started) return loading ?? Promise.resolve();
  started = true;

  if (Platform.OS === 'web') {
    setState({ loaded: true, seen: false, error: null });
    return Promise.resolve();
  }

  loading = Promise.resolve()
    .then(() => SecureStore.getItemAsync(KEY))
    .then(
      (value) => setState({ loaded: true, seen: value === '1', error: null }),
      () =>
        setState({
          loaded: true,
          seen: false,
          error: "We couldn't check whether you've seen this introduction before.",
        }),
    )
    .finally(() => {
      loading = null;
    });

  return loading;
}

export function retryLoadOnboarding(): Promise<void> {
  if (loading) return loading;
  started = false;
  setState({ ...state, error: null });
  return loadOnboarding();
}

export async function completeOnboarding(): Promise<void> {
  if (Platform.OS !== 'web') await SecureStore.setItemAsync(KEY, '1');
  setState({ loaded: true, seen: true, error: null });
}

export function useOnboarding(): OnboardingState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
