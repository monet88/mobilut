import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorBanner, LoadingOverlay } from '@ui/feedback';
import { Button, Text } from '@ui/primitives';
import type { ImportedLut } from '@services/lut/lut-import.service';
import { colors, spacing } from '@theme/tokens';

import { useImportLut } from './use-import-lut';

interface ImportLutScreenProps {
  readonly onLutImported?: (lut: ImportedLut) => void;
}

export function ImportLutScreen({ onLutImported }: ImportLutScreenProps): React.JSX.Element {
  const { isLoading, error, importLut } = useImportLut();

  const handleImport = async (): Promise<void> => {
    const lut = await importLut();

    if (lut && onLutImported) {
      onLutImported(lut);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="heading" style={styles.title}>
          Import LUT
        </Text>
        <Text variant="body" style={styles.subtitle}>
          Browse and import a .cube file from your device.
        </Text>

        {error ? <ErrorBanner message={error.message} onRetry={handleImport} /> : null}

        <Button
          label="Browse .cube Files"
          onPress={handleImport}
          disabled={isLoading}
          loading={isLoading}
        />
      </View>

      <LoadingOverlay visible={isLoading} message="Importing LUT…" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    gap: spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: colors.secondary,
  },
});
