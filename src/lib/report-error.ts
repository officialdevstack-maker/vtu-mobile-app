import * as Sentry from '@sentry/react-native';

type ErrorReport = {
  source: string;
  tags?: Record<string, string>;
  fingerprint?: string[];
};

export function reportError({ source, tags, fingerprint }: ErrorReport): void {
  Sentry.withScope((scope) => {
    scope.setTag('error.source', source);
    for (const [key, value] of Object.entries(tags ?? {})) {
      scope.setTag(key, value);
    }
    if (fingerprint) scope.setFingerprint(fingerprint);
    Sentry.captureException(new Error(`${source} operation failed`));
  });
}
