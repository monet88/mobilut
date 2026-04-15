import React from 'react';
import { ViewProps } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@theme/use-theme';

export interface SafeAreaViewProps extends ViewProps {
  readonly children: React.ReactNode;
}

export function SafeAreaView({ children, style, ...rest }: SafeAreaViewProps): React.JSX.Element {
  const theme = useTheme();

  return (
    <RNSafeAreaView
      style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}
      {...rest}
    >
      {children}
    </RNSafeAreaView>
  );
}
