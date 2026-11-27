import { Linking, ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { errorMessage, isApiError } from '@/api/errors';
import { useSession } from '@/auth/session';
import { StateView } from '@/components/state-view';
import { fontSize, useColors } from '@/theme';

type EmptyStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function EmptyState({
  title = 'Nothing here yet',
  message = 'When there is something to show, it will appear here.',
  actionLabel,
  onAction,
  compact,
}: EmptyStateProps) {
  return (
    <StateView
      compact={compact}
      icon={{ ios: 'tray.fill', android: 'inbox', web: 'inbox' }}
      title={title}
      message={message}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}

type LoadingStateProps = {
  message?: string;
  slow?: boolean;
  compact?: boolean;
};

export function LoadingState({ message = 'Loading…', slow = false, compact }: LoadingStateProps) {
  const colors = useColors();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={slow ? 'Still loading. Slow connection.' : message}
      accessibilityLiveRegion="polite"
      style={[styles.loading, compact ? styles.loadingCompact : styles.loadingFull]}>
      <ActivityIndicator color={colors.text} size="large" />
      <Text style={[styles.loadingText, { color: colors.text }]}>
        {slow ? 'Still working on it…' : message}
      </Text>
      {slow ? (
        <Text style={[styles.loadingHint, { color: colors.textSecondary }]}>
          Your connection looks slow. This may take a little longer.
        </Text>
      ) : null}
    </View>
  );
}

type ErrorStateProps = {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  compact?: boolean;
};

export function ErrorState({
  error,
  title = 'Something went wrong',
  onRetry,
  compact,
}: ErrorStateProps) {
  const { signOut } = useSession();

  if (isApiError(error)) {
    if (error.code === 'network_error') {
      return <NoInternetState onRetry={onRetry} compact={compact} />;
    }
    if (error.code === 'timeout') {
      return <SlowNetworkState onRetry={onRetry} compact={compact} />;
    }
    if (error.code === 'unauthorized') {
      return <SessionExpiredState onSignIn={() => void signOut()} compact={compact} />;
    }
    if (error.code === 'forbidden') return <PermissionDeniedState compact={compact} />;
    if (error.code === 'account_suspended') {
      return (
        <StateView
          alert
          compact={compact}
          tone="danger"
          icon={{ ios: 'person.crop.circle.badge.exclamationmark', android: 'block', web: 'block' }}
          title="Account suspended"
          message={error.message}
          actionLabel="Sign out"
          onAction={() => void signOut()}
        />
      );
    }
    if (error.code === 'rate_limited') {
      return (
        <StateView
          alert
          compact={compact}
          icon={{ ios: 'hourglass', android: 'hourglass_top', web: 'hourglass_top' }}
          title="Too many requests"
          message={`Please wait ${error.retryAfterSeconds ?? 60} seconds and try again.`}
          actionLabel={onRetry ? 'Try again' : undefined}
          onAction={onRetry}
        />
      );
    }
  }
  return (
    <StateView
      alert
      compact={compact}
      tone="danger"
      icon={{ ios: 'exclamationmark.triangle.fill', android: 'error', web: 'error' }}
      title={title}
      message={errorMessage(error)}
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
    />
  );
}

type RetryProps = { onRetry?: () => void; compact?: boolean };

export function NoInternetState({ onRetry, compact }: RetryProps) {
  return (
    <StateView
      alert
      compact={compact}
      tone="danger"
      icon={{ ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' }}
      title="No internet connection"
      message="Check your Wi-Fi or mobile data, then try again."
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
    />
  );
}

export function SlowNetworkState({ onRetry, compact }: RetryProps) {
  return (
    <StateView
      alert
      compact={compact}
      tone="danger"
      icon={{ ios: 'wifi.exclamationmark', android: 'network_check', web: 'network_check' }}
      title="Slow connection"
      message="This is taking longer than usual. You can wait or try again."
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
    />
  );
}

type NoSearchResultsProps = {
  query: string;
  onClear?: () => void;
  compact?: boolean;
};

export function NoSearchResultsState({ query, onClear, compact }: NoSearchResultsProps) {
  const text = query.trim();
  return (
    <StateView
      compact={compact}
      icon={{ ios: 'magnifyingglass', android: 'search_off', web: 'search_off' }}
      title="No results found"
      message={
        text
          ? `Nothing matches "${text}". Check the spelling or try different words.`
          : 'Nothing matches these filters.'
      }
      actionLabel={onClear ? 'Clear search' : undefined}
      onAction={onClear}
    />
  );
}

type PermissionDeniedProps = {
  feature?: string;
  canOpenSettings?: boolean;
  onBack?: () => void;
  compact?: boolean;
};

export function PermissionDeniedState({
  feature,
  canOpenSettings = false,
  onBack,
  compact,
}: PermissionDeniedProps) {
  return (
    <StateView
      alert
      compact={compact}
      tone="danger"
      icon={{ ios: 'hand.raised.fill', android: 'block', web: 'block' }}
      title="Permission denied"
      message={
        feature
          ? `Allow ${feature} access in your device settings to use this feature.`
          : "You don't have permission to do this."
      }
      actionLabel={canOpenSettings ? 'Open settings' : onBack ? 'Go back' : undefined}
      onAction={canOpenSettings ? () => void Linking.openSettings() : onBack}
      secondaryLabel={canOpenSettings && onBack ? 'Go back' : undefined}
      onSecondary={onBack}
    />
  );
}

type SessionExpiredProps = {
  onSignIn: () => void;
  compact?: boolean;
};

export function SessionExpiredState({ onSignIn, compact }: SessionExpiredProps) {
  return (
    <StateView
      alert
      compact={compact}
      icon={{ ios: 'lock.fill', android: 'lock_clock', web: 'lock_clock' }}
      title="Session expired"
      message="For your security, please sign in again to continue."
      actionLabel="Sign in again"
      onAction={onSignIn}
    />
  );
}

type SuccessStateProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  compact?: boolean;
};

export function SuccessState({
  title,
  message,
  actionLabel = 'Done',
  onAction,
  secondaryLabel,
  onSecondary,
  compact,
}: SuccessStateProps) {
  return (
    <StateView
      compact={compact}
      tone="success"
      icon={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
      title={title}
      message={message}
      actionLabel={onAction ? actionLabel : undefined}
      onAction={onAction}
      secondaryLabel={secondaryLabel}
      onSecondary={onSecondary}
    />
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', gap: 12, alignSelf: 'stretch' },
  loadingFull: { paddingVertical: 48, paddingHorizontal: 16 },
  loadingCompact: { paddingVertical: 20, paddingHorizontal: 12 },
  loadingText: { fontSize: fontSize.md, fontWeight: '600', textAlign: 'center' },
  loadingHint: { fontSize: fontSize.base, lineHeight: 20, textAlign: 'center', maxWidth: 300 },
});
