import React from 'react';
import { ActivityIndicator, Modal, View } from 'react-native';

import { useTheme } from '@theme/use-theme';

import { Text } from '@ui/primitives';

export interface LoadingOverlayProps {
  readonly visible: boolean;
  readonly message?: string;
}

export function LoadingOverlay({
  visible,
  message = 'Loading…',
}: LoadingOverlayProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.lg,
        }}
      >
        <View
          style={{
            minWidth: 160,
            borderRadius: theme.radius.xl,
            borderCurve: 'continuous',
            backgroundColor: theme.colors.surface,
            padding: theme.spacing.lg,
            alignItems: 'center',
            gap: theme.spacing.md,
          }}
        >
          <ActivityIndicator color={theme.colors.accent} size="large" />
          <Text variant="body">{message}</Text>
        </View>
      </View>
    </Modal>
  );
}
