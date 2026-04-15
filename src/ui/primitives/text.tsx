import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@theme/use-theme';

export type TextVariant = 'body' | 'caption' | 'heading' | 'label';

export interface TextProps extends RNTextProps {
  readonly variant?: TextVariant;
  readonly color?: string;
}

const variantStyles = {
  body: {
    fontSize: 'md',
    fontWeight: 'regular',
    color: 'primary',
  },
  caption: {
    fontSize: 'sm',
    fontWeight: 'regular',
    color: 'secondary',
  },
  heading: {
    fontSize: 'xl',
    fontWeight: 'semibold',
    color: 'primary',
  },
  label: {
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'secondary',
  },
} as const;

export function Text({
  children,
  variant = 'body',
  color,
  selectable = true,
  style,
  ...rest
}: TextProps): React.JSX.Element {
  const theme = useTheme();
  const variantStyle = variantStyles[variant];

  return (
    <RNText
      selectable={selectable}
      style={[
        {
          color: color ?? theme.colors[variantStyle.color],
          fontSize: theme.typography.sizes[variantStyle.fontSize],
          fontWeight: theme.typography.weights[variantStyle.fontWeight],
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}
