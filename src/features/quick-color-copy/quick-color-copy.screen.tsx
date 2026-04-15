import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { LutTable } from '@lut-core/model/lut-table';
import { ErrorBanner, LoadingOverlay } from '@ui/feedback';
import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

import { useQuickColorCopy } from './use-quick-color-copy';

export interface QuickColorCopyScreenProps {
  readonly sourcePixels?: Float32Array;
  readonly targetPixels?: Float32Array;
  readonly onGenerated?: (lut: LutTable) => void;
}

const DEFAULT_SOURCE_PIXELS = new Float32Array([0.92, 0.84, 0.74, 0.81, 0.7, 0.59]);
const DEFAULT_TARGET_PIXELS = new Float32Array([0.31, 0.36, 0.42, 0.24, 0.29, 0.35]);

export function QuickColorCopyScreen({
  sourcePixels = DEFAULT_SOURCE_PIXELS,
  targetPixels = DEFAULT_TARGET_PIXELS,
  onGenerated,
}: QuickColorCopyScreenProps): React.JSX.Element {
  const { isProcessing, error, generatedLut, generateFromImages } = useQuickColorCopy();

  const handleGenerate = async (): Promise<void> => {
    const lut = await generateFromImages(sourcePixels, targetPixels);

    if (lut) {
      onGenerated?.(lut);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="heading" style={styles.title}>
        Quick Color Copy
      </Text>
      <Text variant="body" style={styles.subtitle}>
        Generate a starter LUT offline by matching the target image color statistics to the source
        look.
      </Text>

      {error ? <ErrorBanner message={error.message} onRetry={handleGenerate} /> : null}

      <View style={styles.previewCard}>
        <Text variant="label">Status</Text>
        <Text variant="body">
          {generatedLut
            ? `Generated ${generatedLut.size}×${generatedLut.size}×${generatedLut.size} LUT for export or editor import.`
            : 'Ready to sample two images and synthesize a LUT.'}
        </Text>
      </View>

      <Button
        label="Generate LUT"
        onPress={handleGenerate}
        loading={isProcessing}
        disabled={isProcessing}
      />

      <LoadingOverlay visible={isProcessing} message="Building LUT from image statistics…" />
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
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: colors.secondary,
  },
  previewCard: {
    gap: spacing.sm,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
  },
});
