// src/auth/storage.ts

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type StoredTokens = {
  accessToken: string;
  refreshToken: string | null;
};

const ACCESS_KEY = 'spur_access_token';
const REFRESH_KEY = 'spur_refresh_token';

let webMemory: StoredTokens | null = null;

export async function loadTokens(): Promise<StoredTokens | null> {
  if (Platform.OS === 'web') return webMemory;
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return accessToken ? { accessToken, refreshToken } : null;
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  if (Platform.OS === 'web') {
    webMemory = tokens;
    return;
  }
  await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  }
}

export async function clearTokens(): Promise<void> {
  if (Platform.OS === 'web') {
    webMemory = null;
    return;
  }
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
