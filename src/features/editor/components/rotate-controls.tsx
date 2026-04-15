import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

export interface RotateControlsProps {
  readonly rotation: 0 | 90 | 180 | 270;
  readonly onRotateClockwise: () => void;
  readonly onRotateCounterClockwise: () => void;
}

export function RotateControls({
  rotation,
  onRotateClockwise,
  onRotateCounterClockwise,
}: RotateControlsProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="label">Rotate</Text>
        <Text variant="caption">Current: {rotation}°</Text>
      </View>
      <View style={styles.controls}>
        <Button label="Rotate CCW" onPress={onRotateCounterClockwise} variant="secondary" />
        <Button label="Rotate CW" onPress={onRotateClockwise} variant="secondary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  controls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
