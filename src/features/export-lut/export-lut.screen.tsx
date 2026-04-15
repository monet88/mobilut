import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import type { LutTable } from '@lut-core/model/lut-table';
import { ErrorBanner, LoadingOverlay } from '@ui/feedback';
import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

import { useExportLut } from './use-export-lut';

export interface ExportLutScreenProps {
  readonly table: LutTable;
  readonly initialName?: string;
}

export function ExportLutScreen({
  table,
  initialName = 'lut-app-export',
}: ExportLutScreenProps): React.JSX.Element {
  const { isExporting, error, exportCube, shareCube } = useExportLut();
  const [name, setName] = React.useState(initialName);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleExport = async (): Promise<void> => {
    const result = await exportCube(table, name);

    if (result) {
      setSuccessMessage(`Saved ${result.filename} to the app cache.`);
    }
  };

  const handleShare = async (): Promise<void> => {
    await shareCube(table, name);
    setSuccessMessage('Opened the share sheet for your .cube LUT.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="heading" style={styles.title}>
          Export LUT
        </Text>
        <Text variant="body" style={styles.subtitle}>
          Save the current LUT as a .cube file for Adobe workflows and other grading tools.
        </Text>

        {error ? <ErrorBanner message={error.message} /> : null}
        {successMessage ? (
          <View style={styles.successBanner}>
            <Text variant="label" color={colors.success}>
              Export ready
            </Text>
            <Text variant="body">{successMessage}</Text>
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text variant="label">Filename</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="lut-app-export"
            placeholderTextColor={colors.secondary}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.actions}>
          <Button
            label="Export .cube"
            onPress={handleExport}
            loading={isExporting}
            disabled={isExporting}
          />
          <Button
            label="Share .cube"
            onPress={handleShare}
            variant="secondary"
            loading={isExporting}
            disabled={isExporting}
          />
        </View>
      </View>

      <LoadingOverlay visible={isExporting} message="Exporting LUT…" />
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
  fieldGroup: {
    gap: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    color: colors.primary,
  },
  successBanner: {
    gap: spacing.xs,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
});
