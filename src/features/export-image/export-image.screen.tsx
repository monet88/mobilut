import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { EditState } from '@core/edit-session/edit-state';
import type { ExportFormat } from '@core/image-pipeline';
import { ErrorBanner, LoadingOverlay } from '@ui/feedback';
import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

import { useExportImage } from './use-export-image';

export interface ExportImageScreenProps {
  readonly editState: EditState;
}

const FORMAT_OPTIONS: readonly Extract<ExportFormat, 'jpeg' | 'png'>[] = ['jpeg', 'png'];

export function ExportImageScreen({ editState }: ExportImageScreenProps): React.JSX.Element {
  const { isExporting, error, exportToGallery, exportAndShare } = useExportImage();
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = React.useState<Extract<ExportFormat, 'jpeg' | 'png'>>(
    'jpeg',
  );

  const handleSave = async (): Promise<void> => {
    const result = await exportToGallery(editState, selectedFormat);

    if (result) {
      setSuccessMessage(`Saved ${result.format.toUpperCase()} export to your gallery.`);
    }
  };

  const handleShare = async (): Promise<void> => {
    const result = await exportAndShare(editState, selectedFormat);

    if (result) {
      setSuccessMessage(`Opened the share sheet for your ${result.format.toUpperCase()} export.`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="heading" style={styles.title}>
          Export Image
        </Text>
        <Text variant="body" style={styles.subtitle}>
          Choose PNG or JPEG for the current crop and rotation export.
        </Text>

        <View style={styles.formatRow}>
          {FORMAT_OPTIONS.map((format) => {
            const isSelected = selectedFormat === format;

            return (
              <Pressable
                key={format}
                accessibilityRole="button"
                onPress={() => setSelectedFormat(format)}
                style={[styles.formatChip, isSelected ? styles.formatChipSelected : null]}
              >
                <Text
                  selectable={false}
                  variant="label"
                  color={isSelected ? colors.background : colors.primary}
                >
                  {format.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error ? <ErrorBanner message={error.message} /> : null}
        {successMessage ? (
          <View style={styles.successBanner}>
            <Text variant="label" color={colors.success}>
              Export ready
            </Text>
            <Text variant="body">{successMessage}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            label="Save to Gallery"
            onPress={handleSave}
            loading={isExporting}
            disabled={isExporting}
          />
          <Button
            label="Share"
            onPress={handleShare}
            variant="secondary"
            loading={isExporting}
            disabled={isExporting}
          />
        </View>
      </View>

      <LoadingOverlay visible={isExporting} message="Exporting image…" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    padding: spacing.md,
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
  successBanner: {
    gap: spacing.xs,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing.md,
  },
  actions: {
    gap: spacing.sm,
  },
  formatRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formatChip: {
    minHeight: 40,
    minWidth: 88,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  formatChipSelected: {
    backgroundColor: colors.accent,
  },
});
