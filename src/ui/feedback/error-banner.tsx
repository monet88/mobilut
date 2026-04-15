import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@theme/use-theme';

import { Button, Text } from '@ui/primitives';

export interface ErrorBannerProps {
  readonly message: string;
  readonly retryLabel?: string;
  readonly onRetry?: () => void;
}

export function ErrorBanner({
  message,
  retryLabel = 'Retry',
  onRetry,
}: ErrorBannerProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={{
        borderRadius: theme.radius.lg,
        borderCurve: 'continuous',
        backgroundColor: theme.colors.surfaceElevated,
        borderWidth: 1,
        borderColor: theme.colors.error,
        padding: theme.spacing.md,
        gap: theme.spacing.md,
      }}
    >
      <Text variant="label" color={theme.colors.error}>
        Something went wrong
      </Text>
      <Text variant="body">{message}</Text>
      {onRetry ? <Button label={retryLabel} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}
