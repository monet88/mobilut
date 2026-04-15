import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, View } from 'react-native';

import { useTheme } from '@theme/use-theme';

import { Text } from './text';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  readonly label: string;
  readonly variant?: ButtonVariant;
  readonly loading?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  onPress,
  ...rest
}: ButtonProps): React.JSX.Element {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        borderRadius: theme.radius.lg,
        borderCurve: 'continuous',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: isPrimary ? theme.colors.primary : theme.colors.surfaceElevated,
        borderWidth: isPrimary ? 0 : 1,
        borderColor: theme.colors.border,
        opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        alignItems: 'center',
        justifyContent: 'center',
      })}
      {...rest}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        {loading ? (
          <ActivityIndicator color={isPrimary ? theme.colors.background : theme.colors.primary} />
        ) : null}
        <Text
          selectable={false}
          variant="label"
          color={isPrimary ? theme.colors.background : theme.colors.primary}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
