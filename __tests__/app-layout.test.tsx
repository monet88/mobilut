import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockInitI18n = jest.fn();

jest.mock('@i18n', () => ({
  initI18n: mockInitI18n,
}));

jest.mock('@theme/use-theme', () => ({
  ThemeProvider: function MockThemeProvider({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');

  const Stack = function MockStack({ children }: { children: React.ReactNode }) {
    return <View>{children}</View>;
  };
  Stack.Screen = function MockStackScreen() {
    return null;
  };

  return { Stack };
});

const RootLayout = require('../app/_layout').default;

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes i18n to English at app bootstrap', async () => {
    render(<RootLayout />);

    await waitFor(() => {
      expect(mockInitI18n).toHaveBeenCalledWith('en');
    });
  });
});
