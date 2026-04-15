import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { EditState } from '@core/edit-session/edit-state';
import { ErrorBanner, LoadingOverlay } from '@ui/feedback';
import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

import { useExportImage } from './use-export-image';

export interface ExportImageScreenProps {
  readonly editState: EditState;
}

export function ExportImageScreen({ editState }: ExportImageScreenProps): React.JSX.Element {
  const { isExporting, error, exportToGallery, exportAndShare } = useExportImage();
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleSave = async (): Promise<void> => {
    const result = await exportToGallery(editState);

    if (result) {
      setSuccessMessage('Saved export to your gallery.');
    }
  };

  const handleShare = async (): Promise<void> => {
    const result = await exportAndShare(editState);

    if (result) {
      setSuccessMessage('Opened the share sheet for your export.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="heading" style={styles.title}>
          Export Image
        </Text>
        <Text variant="body" style={styles.subtitle}>
          Export the current edit as a full-resolution JPEG with crop and rotation applied.
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
});
