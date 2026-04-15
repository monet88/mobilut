import React from 'react';
import { Animated } from 'react-native';

import { useTheme } from '@theme/use-theme';

import { Text } from '@ui/primitives';

export interface ToastProps {
  readonly visible: boolean;
  readonly message: string;
  readonly durationMs?: number;
  readonly onDismiss?: () => void;
}

export function Toast({
  visible,
  message,
  durationMs = 2400,
  onDismiss,
}: ToastProps): React.JSX.Element | null {
  const theme = useTheme();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(12)).current;

  React.useEffect(() => {
    if (!visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 12,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
      return undefined;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 12,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onDismiss?.();
        }
      });
    }, durationMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [durationMs, onDismiss, opacity, translateY, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        bottom: theme.spacing.xl,
        opacity,
        transform: [{ translateY }],
        backgroundColor: theme.colors.surfaceElevated,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
      }}
    >
      <Text variant="body">{message}</Text>
    </Animated.View>
  );
}
