import React from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

import { ThemeProvider } from '@theme/use-theme';

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.error}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMsg}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'LUT App' }} />
        <Stack.Screen name="editor/[assetId]" options={{ title: 'Editor', headerShown: false }} />
        <Stack.Screen name="import/index" options={{ title: 'Import' }} />
        <Stack.Screen name="export/index" options={{ title: 'Export' }} />
        <Stack.Screen name="presets/index" options={{ title: 'Presets' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0A0A0A' },
  errorTitle: { color: '#FF4444', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  errorMsg: { color: '#AAAAAA', fontSize: 13, textAlign: 'center' },
});
