import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import type { EditAction } from '@core/edit-session/edit-action';
import type { RegionMask } from '@core/edit-session/edit-state';
import { Button, Slider, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

import { useRegionMask } from './use-region-mask';

export interface RegionMaskEditorProps {
  readonly mask: RegionMask | null;
  readonly dispatch: (action: EditAction) => void;
  readonly onMaskChange?: (mask: RegionMask | null) => void;
}

const DEFAULT_MASK: RegionMask = {
  type: 'rect',
  x: 0.15,
  y: 0.15,
  width: 0.7,
  height: 0.7,
  feather: 0.15,
  inverted: false,
};

export function RegionMaskEditor({
  mask,
  dispatch,
  onMaskChange,
}: RegionMaskEditorProps): React.JSX.Element {
  const { setMask, clearMask } = useRegionMask(dispatch);
  const currentMask = mask ?? DEFAULT_MASK;

  const applyMask = React.useCallback(
    (nextMask: RegionMask | null) => {
      if (nextMask) {
        setMask(nextMask);
      } else {
        clearMask();
      }

      onMaskChange?.(nextMask);
    },
    [clearMask, onMaskChange, setMask],
  );

  const updateMask = React.useCallback(
    (updates: Partial<RegionMask>) => {
      applyMask({
        ...currentMask,
        ...updates,
      });
    },
    [applyMask, currentMask],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="label">Region mask</Text>
        <Button label="Clear" onPress={() => applyMask(null)} variant="secondary" />
      </View>

      <View style={styles.panel}>
        <Text variant="caption">
          Select a simple rect or ellipse mask and preview the covered region before applying local
          effects.
        </Text>

        <View style={styles.previewCard}>
          <View style={styles.previewBounds}>
            <View
              style={[
                styles.overlayMask,
                currentMask.type === 'ellipse' ? styles.ellipseMask : styles.rectMask,
                {
                  left: `${currentMask.x * 100}%`,
                  top: `${currentMask.y * 100}%`,
                  width: `${currentMask.width * 100}%`,
                  height: `${currentMask.height * 100}%`,
                  opacity: Math.max(0.15, 1 - currentMask.feather * 0.6),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.maskTypeRow}>
          {(['rect', 'ellipse'] as const).map((type) => {
            const isSelected = currentMask.type === type;

            return (
              <Pressable
                key={type}
                accessibilityRole="button"
                onPress={() => updateMask({ type })}
                style={[styles.maskTypeChip, isSelected ? styles.maskTypeChipSelected : null]}
              >
                <Text
                  selectable={false}
                  variant="label"
                  color={isSelected ? colors.background : colors.primary}
                  style={styles.maskTypeText}
                >
                  {type === 'rect' ? 'Rectangle' : 'Ellipse'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Slider
          label="X"
          value={currentMask.x}
          minimumValue={0}
          maximumValue={0.8}
          step={0.01}
          onValueChange={(value) => updateMask({ x: value })}
        />
        <Slider
          label="Y"
          value={currentMask.y}
          minimumValue={0}
          maximumValue={0.8}
          step={0.01}
          onValueChange={(value) => updateMask({ y: value })}
        />
        <Slider
          label="Width"
          value={currentMask.width}
          minimumValue={0.1}
          maximumValue={1}
          step={0.01}
          onValueChange={(value) => updateMask({ width: value })}
        />
        <Slider
          label="Height"
          value={currentMask.height}
          minimumValue={0.1}
          maximumValue={1}
          step={0.01}
          onValueChange={(value) => updateMask({ height: value })}
        />
        <Slider
          label="Feather"
          value={currentMask.feather}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          onValueChange={(value) => updateMask({ feather: value })}
        />

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text variant="label">Invert mask</Text>
            <Text variant="caption">
              Flip the selected region so adjustments apply outside the frame.
            </Text>
          </View>
          <Switch
            value={currentMask.inverted}
            onValueChange={(value) => updateMask({ inverted: value })}
          />
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
    aspectRatio: 1.2,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
  },
  previewBounds: {
    flex: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  overlayMask: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: 'rgba(255, 107, 53, 0.25)',
  },
  rectMask: {
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  ellipseMask: {
    borderRadius: 999,
  },
  maskTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  maskTypeChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  maskTypeChipSelected: {
    backgroundColor: colors.accent,
  },
  maskTypeText: {
    textTransform: 'capitalize',
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
});
