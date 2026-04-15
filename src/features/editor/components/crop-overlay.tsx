import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
  readonly onChangeCrop: (crop: CropParams) => void;
}

export function CropOverlay({ crop, onChangeCrop }: CropOverlayProps): React.JSX.Element {
  const currentCrop = crop ?? {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    aspectRatio: null,
  };

  return (
    <View style={styles.container}>
      <Text variant="label">Crop</Text>
      <View style={styles.panel}>
        <View style={styles.overlayCard}>
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
            <View style={[styles.handle, styles.topLeftHandle]} />
            <View style={[styles.handle, styles.topRightHandle]} />
            <View style={[styles.handle, styles.bottomLeftHandle]} />
            <View style={[styles.handle, styles.bottomRightHandle]} />
          </View>
        </View>

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
                style={[styles.aspectRatioChip, isSelected ? styles.aspectRatioChipSelected : null]}
              >
                <Text
                  selectable={false}
                  variant="label"
                  color={isSelected ? colors.background : colors.primary}
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
    gap: spacing.sm,
  },
  panel: {
    gap: spacing.md,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  overlayCard: {
    aspectRatio: 1,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    position: 'relative',
    overflow: 'hidden',
  },
  cropFrame: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
  },
  handle: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderCurve: 'continuous',
    backgroundColor: colors.primary,
  },
  topLeftHandle: {
    left: -9,
    top: -9,
  },
  topRightHandle: {
    right: -9,
    top: -9,
  },
  bottomLeftHandle: {
    left: -9,
    bottom: -9,
  },
  bottomRightHandle: {
    right: -9,
    bottom: -9,
  },
  aspectRatioContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  aspectRatioChip: {
    minHeight: 36,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aspectRatioChipSelected: {
    backgroundColor: colors.accent,
  },
});
