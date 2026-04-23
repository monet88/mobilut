import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PreviewCanvas } from '@adapters/skia/preview-canvas';
import type { CropParams } from '@core/edit-session/edit-state';
import { Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

const ASPECT_RATIO_OPTIONS = [
  { label: 'Free', value: null },
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
] as const;

export interface CropOverlayProps {
  readonly crop: CropParams | null;
  readonly imageUri: string;
  readonly previewWidth: number;
  readonly previewHeight: number;
  readonly onChangeCrop: (crop: CropParams) => void;
}

export function CropOverlay({
  crop,
  imageUri,
  previewWidth,
  previewHeight,
  onChangeCrop,
}: CropOverlayProps): React.JSX.Element {
  const currentCrop = crop ?? {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    aspectRatio: null,
  };

  return (
    <View style={styles.container}>
      <View style={styles.previewStage}>
        <View style={styles.previewClip}>
          <PreviewCanvas imageUri={imageUri} width={previewWidth} height={previewHeight} />
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View
              style={[
                styles.cropFrame,
                {
                  left: `${currentCrop.x * 100}%`,
                  top: `${currentCrop.y * 100}%`,
                  width: `${currentCrop.width * 100}%`,
                  height: `${currentCrop.height * 100}%`,
                },
              ]}
            >
              <View style={[styles.corner, styles.topLeftCorner]} />
              <View style={[styles.corner, styles.topRightCorner]} />
              <View style={[styles.corner, styles.bottomLeftCorner]} />
              <View style={[styles.corner, styles.bottomRightCorner]} />
              <View style={[styles.edgeTick, styles.topEdgeTick]} />
              <View style={[styles.edgeTick, styles.bottomEdgeTick]} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <Text selectable={false} variant="caption" style={styles.controlEyebrow}>
          Ratio
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.aspectRatioContent}
        >
          {ASPECT_RATIO_OPTIONS.map((option) => {
            const isSelected = option.value === currentCrop.aspectRatio;

            return (
              <Pressable
                key={option.label}
                accessibilityRole="button"
                onPress={() =>
                  onChangeCrop({
                    ...buildCropForAspectRatio(option.value),
                    aspectRatio: option.value,
                  })
                }
                style={({ pressed }) => [
                  styles.aspectRatioChip,
                  isSelected ? styles.aspectRatioChipSelected : null,
                  pressed ? styles.aspectRatioChipPressed : null,
                ]}
              >
                <Text
                  selectable={false}
                  variant="caption"
                  color={isSelected ? colors.primary : colors.secondary}
                  style={styles.aspectRatioLabel}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

function buildCropForAspectRatio(aspectRatio: string | null): Omit<CropParams, 'aspectRatio'> {
  switch (aspectRatio) {
    case '1:1':
      return { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
    case '4:3':
      return { x: 0.08, y: 0.12, width: 0.84, height: 0.63 };
    case '16:9':
      return { x: 0.05, y: 0.22, width: 0.9, height: 0.5 };
    case '9:16':
      return { x: 0.22, y: 0.05, width: 0.56, height: 0.9 };
    default:
      return { x: 0.05, y: 0.05, width: 0.9, height: 0.9 };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
  },
  previewStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.md,
  },
  previewClip: {
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  cropFrame: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  corner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: colors.accent,
  },
  topLeftCorner: {
    left: -1,
    top: -1,
    borderLeftWidth: 2.5,
    borderTopWidth: 2.5,
  },
  topRightCorner: {
    right: -1,
    top: -1,
    borderRightWidth: 2.5,
    borderTopWidth: 2.5,
  },
  bottomLeftCorner: {
    left: -1,
    bottom: -1,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
  },
  bottomRightCorner: {
    right: -1,
    bottom: -1,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
  },
  edgeTick: {
    position: 'absolute',
    left: '50%',
    width: 20,
    height: 2,
    marginLeft: -10,
    backgroundColor: colors.accent,
  },
  topEdgeTick: {
    top: -1,
  },
  bottomEdgeTick: {
    bottom: -1,
  },
  controls: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  controlEyebrow: {
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  aspectRatioContent: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  aspectRatioChip: {
    minHeight: 38,
    minWidth: 54,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm + spacing.xs,
  },
  aspectRatioChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  aspectRatioChipPressed: {
    opacity: 0.8,
  },
  aspectRatioLabel: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
