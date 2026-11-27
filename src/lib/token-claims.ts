// src/lib/token-claims.ts

export type TokenSummary = {
  format: 'jwt' | 'opaque' | 'none';
  iss: string;
  aud: string;
  client: string;
  scope: string;
  lifetimeSeconds: string;
  expired: string;
};

function decodePayload(part: string): Record<string, unknown> | null {
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const value: unknown = JSON.parse(atob(padded));
    return typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function text(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(',').slice(0, 150);
  return value === undefined || value === null ? 'missing' : String(value).slice(0, 150);
}

export function summarizeToken(token: string | null): TokenSummary {
  const empty = { iss: '-', aud: '-', client: '-', scope: '-', lifetimeSeconds: '-', expired: '-' };
  if (!token) return { format: 'none', ...empty };
  const parts = token.split('.');
  const claims = parts.length === 3 && parts[1] ? decodePayload(parts[1]) : null;
  if (!claims) return { format: 'opaque', ...empty };

  const exp = typeof claims.exp === 'number' ? claims.exp : null;
  const iat = typeof claims.iat === 'number' ? claims.iat : null;
  return {
    format: 'jwt',
    iss: text(claims.iss),
    aud: text(claims.aud),
    client: text(claims.azp ?? claims.client_id),
    scope: text(claims.scope),
    lifetimeSeconds: exp !== null && iat !== null ? String(exp - iat) : 'unknown',
    expired: exp !== null ? String(exp * 1000 < Date.now()) : 'unknown',
  };
}
