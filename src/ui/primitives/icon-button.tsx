import React from 'react';
import { Pressable, PressableProps } from 'react-native';

import { useTheme } from '@theme/use-theme';

import { Text } from './text';

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  readonly icon: string;
  readonly accessibilityLabel: string;
}

export function IconButton({
  icon,
  accessibilityLabel,
  disabled,
  onPress,
  ...rest
}: IconButtonProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        borderCurve: 'continuous',
        backgroundColor: theme.colors.surfaceElevated,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
      })}
      {...rest}
    >
      <Text selectable={false} variant="heading">
        {icon}
      </Text>
    </Pressable>
  );
}
