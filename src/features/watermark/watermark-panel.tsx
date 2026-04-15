import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import type { EditAction } from '@core/edit-session/edit-action';
import type { WatermarkParams } from '@core/edit-session/edit-state';
import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

import { useWatermark } from './use-watermark';

export interface WatermarkPanelProps {
  readonly watermark: WatermarkParams | null;
  readonly dispatch: (action: EditAction) => void;
}

const DEFAULT_WATERMARK: WatermarkParams = {
  enabled: true,
  cameraLogoId: null,
  showExif: true,
  position: 'bottom-right',
};

const CAMERA_LOGOS = ['sony', 'canon', 'fujifilm'] as const;
const POSITIONS = ['bottom-left', 'bottom-center', 'bottom-right'] as const;

export function WatermarkPanel({ watermark, dispatch }: WatermarkPanelProps): React.JSX.Element {
  const { setWatermark, clearWatermark } = useWatermark(dispatch);
  const currentWatermark = watermark ?? DEFAULT_WATERMARK;

  const updateWatermark = React.useCallback(
    (updates: Partial<WatermarkParams>) => {
      setWatermark({
        ...currentWatermark,
        ...updates,
      });
    },
    [currentWatermark, setWatermark],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="label">Watermark</Text>
        <Button label="Clear" onPress={clearWatermark} variant="secondary" />
      </View>

      <View style={styles.panel}>
        <Text variant="caption">
          Configure a metadata-aware watermark with EXIF text, camera logos, and a placement
          preview.
        </Text>

        <View style={styles.previewCard}>
          <View style={styles.previewImage}>
            <View
              style={[
                styles.previewWatermark,
                currentWatermark.position === 'bottom-left'
                  ? styles.alignLeft
                  : currentWatermark.position === 'bottom-center'
                    ? styles.alignCenter
                    : styles.alignRight,
              ]}
            >
              <Text selectable={false} variant="caption" color={colors.background}>
                {currentWatermark.cameraLogoId
                  ? `${currentWatermark.cameraLogoId.toUpperCase()} • `
                  : ''}
                ISO 100 · 35mm · f/2.0
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text variant="label">Enable watermark</Text>
            <Text variant="caption">
              Add the selected watermark content to the export pipeline.
            </Text>
          </View>
          <Switch
            value={currentWatermark.enabled}
            onValueChange={(value) => updateWatermark({ enabled: value })}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text variant="label">Show EXIF details</Text>
            <Text variant="caption">Include exposure metadata in the footer-style watermark.</Text>
          </View>
          <Switch
            value={currentWatermark.showExif}
            onValueChange={(value) => updateWatermark({ showExif: value })}
          />
        </View>

        <View style={styles.optionGroup}>
          <Text variant="label">Camera logo</Text>
          <View style={styles.optionRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => updateWatermark({ cameraLogoId: null })}
              style={[
                styles.optionChip,
                currentWatermark.cameraLogoId === null ? styles.optionChipSelected : null,
              ]}
            >
              <Text
                selectable={false}
                variant="label"
                color={currentWatermark.cameraLogoId === null ? colors.background : colors.primary}
              >
                None
              </Text>
            </Pressable>
            {CAMERA_LOGOS.map((cameraLogoId) => {
              const isSelected = currentWatermark.cameraLogoId === cameraLogoId;

              return (
                <Pressable
                  key={cameraLogoId}
                  accessibilityRole="button"
                  onPress={() => updateWatermark({ cameraLogoId })}
                  style={[styles.optionChip, isSelected ? styles.optionChipSelected : null]}
                >
                  <Text
                    selectable={false}
                    variant="label"
                    color={isSelected ? colors.background : colors.primary}
                  >
                    {cameraLogoId}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.optionGroup}>
          <Text variant="label">Position</Text>
          <View style={styles.optionRow}>
            {POSITIONS.map((position) => {
              const isSelected = currentWatermark.position === position;

              return (
                <Pressable
                  key={position}
                  accessibilityRole="button"
                  onPress={() => updateWatermark({ position })}
                  style={[styles.optionChip, isSelected ? styles.optionChipSelected : null]}
                >
                  <Text
                    selectable={false}
                    variant="label"
                    color={isSelected ? colors.background : colors.primary}
                  >
                    {position.replace('bottom-', '')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  panel: {
    gap: spacing.md,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  previewCard: {
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
  },
  previewImage: {
    aspectRatio: 1.2,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  previewWatermark: {
    minHeight: 36,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  alignLeft: {
    alignSelf: 'flex-start',
  },
  alignCenter: {
    alignSelf: 'center',
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  switchText: {
    flex: 1,
    gap: spacing.xs,
  },
  optionGroup: {
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    minHeight: 38,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  optionChipSelected: {
    backgroundColor: colors.accent,
  },
});
