import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { AdjustmentParams } from '@core/edit-session/edit-state';
import { Slider, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

const ADJUSTMENT_CONTROLS = [
  { key: 'intensity', label: 'Intensity', minimumValue: 0, maximumValue: 1, step: 0.01 },
  { key: 'temperature', label: 'Temperature', minimumValue: -100, maximumValue: 100, step: 1 },
  { key: 'brightness', label: 'Brightness', minimumValue: -100, maximumValue: 100, step: 1 },
  { key: 'contrast', label: 'Contrast', minimumValue: -100, maximumValue: 100, step: 1 },
  { key: 'saturation', label: 'Saturation', minimumValue: -100, maximumValue: 100, step: 1 },
  { key: 'sharpen', label: 'Sharpen', minimumValue: 0, maximumValue: 100, step: 1 },
] as const satisfies readonly {
  readonly key: keyof AdjustmentParams;
  readonly label: string;
  readonly minimumValue: number;
  readonly maximumValue: number;
  readonly step: number;
}[];

export interface AdjustmentPanelProps {
  readonly adjustments: AdjustmentParams;
  readonly onChangeAdjustments: (adjustments: Partial<AdjustmentParams>) => void;
}

export function AdjustmentPanel({
  adjustments,
  onChangeAdjustments,
}: AdjustmentPanelProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text variant="label">Adjustments</Text>
      <View style={styles.panel}>
        {ADJUSTMENT_CONTROLS.map((control) => (
          <Slider
            key={control.key}
            label={control.label}
            value={adjustments[control.key]}
            minimumValue={control.minimumValue}
            maximumValue={control.maximumValue}
            step={control.step}
            onValueChange={(value) => onChangeAdjustments({ [control.key]: value })}
          />
        ))}
      </View>
    </View>
  );
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
});
