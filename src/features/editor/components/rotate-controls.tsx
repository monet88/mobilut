import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives';
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
      <Text selectable={false} variant="caption" style={styles.controlEyebrow}>
        Transform
      </Text>
      <View style={styles.row}>
        <RotateButton
          accessibilityLabel="Rotate counterclockwise"
          caption="Left"
          icon="↺"
          onPress={onRotateCounterClockwise}
        />
        <RotateButton
          accessibilityLabel="Rotate clockwise"
          caption="Right"
          icon="↻"
          onPress={onRotateClockwise}
        />
        <View style={styles.statusBadge}>
          <Text selectable={false} variant="caption" style={styles.statusLabel}>
            Current
          </Text>
          <Text selectable={false} variant="label" color={colors.primary} style={styles.statusValue}>
            {rotation}°
          </Text>
        </View>
      </View>
    </View>
  );
}

interface RotateButtonProps {
  readonly accessibilityLabel: string;
  readonly caption: string;
  readonly icon: string;
  readonly onPress: () => void;
}

function RotateButton({
  accessibilityLabel,
  caption,
  icon,
  onPress,
}: RotateButtonProps): React.JSX.Element {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
    >
      <Text selectable={false} variant="heading" color={colors.primary} style={styles.buttonIcon}>
        {icon}
      </Text>
      <Text selectable={false} variant="caption" style={styles.buttonCaption}>
        {caption}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  controlEyebrow: {
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  button: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonIcon: {
    fontSize: 20,
    lineHeight: 22,
  },
  buttonCaption: {
    letterSpacing: 0.4,
  },
  statusBadge: {
    minWidth: 72,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm + spacing.xs,
  },
  statusLabel: {
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontWeight: '600',
  },
});
