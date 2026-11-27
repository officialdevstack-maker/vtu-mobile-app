// src/auth/config.ts

export const SPURS_ISSUER =
  process.env.EXPO_PUBLIC_SPURS_ISSUER ?? 'https://node-accounts-backend.onrender.com/api/oidc';
export const SPURS_CLIENT_ID = process.env.EXPO_PUBLIC_SPURS_CLIENT_ID ?? '';
