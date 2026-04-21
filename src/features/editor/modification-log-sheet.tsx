import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { EditState } from '@core/edit-session/edit-state';
import { BottomSheet } from '@ui/layout';
import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

export interface ModificationLogSheetProps {
  readonly visible: boolean;
  readonly states: readonly EditState[];
  readonly onClose: () => void;
}

export function ModificationLogSheet({
  visible,
  states,
  onClose,
}: ModificationLogSheetProps): React.JSX.Element {
  const entries = React.useMemo(() => buildEntries(states), [states]);

  return (
    <BottomSheet visible={visible} title="Modification Log" onClose={onClose}>
      <View style={styles.content}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="body" style={styles.emptyText}>
              No edits committed yet.
            </Text>
          </View>
        ) : (
          entries.map((entry, index) => (
            <View key={`${entry.label}-${index}`} style={styles.entry}>
              <Text variant="label">Edit {index + 1}</Text>
              <Text variant="body">{entry.label}</Text>
            </View>
          ))
        )}

        <Button label="Done" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

function buildEntries(states: readonly EditState[]): readonly { readonly label: string }[] {
  if (states.length < 2) {
    return [];
  }

  return states.slice(1).map((current, index) => ({
    label: describeTransition(states[index], current),
  }));
}

function describeTransition(previous: EditState, current: EditState): string {
  if (previous.selectedPresetId !== current.selectedPresetId) {
    return current.selectedPresetId ? `LUT · ${current.selectedPresetId}` : 'LUT · Cleared';
  }

  if (!areCustomLutsEqual(previous.customLutTable, current.customLutTable)) {
    return current.customLutTable ? 'LUT · Custom LUT' : 'LUT · Cleared';
  }

  if (!areCropsEqual(previous.crop, current.crop)) {
    if (current.crop === null) {
      return 'Crop · Cleared';
    }

    return `Crop · ${current.crop?.aspectRatio ?? 'Freeform'}`;
  }

  if (previous.rotation !== current.rotation) {
    return `Rotation · ${current.rotation}°`;
  }

  if (!areFramingEqual(previous.framing, current.framing)) {
    return current.framing
      ? `Frame · Border ${Math.round(current.framing.borderWidth * 100)}%`
      : 'Frame · Cleared';
  }

  const adjustedControl = Object.keys(current.adjustments).find((key) => current.adjustments[key as keyof typeof current.adjustments] !== previous.adjustments[key as keyof typeof previous.adjustments]);

  if (adjustedControl) {
    return `Adjustments · ${formatAdjustmentLabel(adjustedControl)}`;
  }

  return 'Adjustments';
}

function areCropsEqual(previous: EditState['crop'], current: EditState['crop']): boolean {
  if (previous === current) {
    return true;
  }

  if (previous === null || current === null) {
    return previous === current;
  }

  return previous.x === current.x && previous.y === current.y && previous.width === current.width && previous.height === current.height && previous.aspectRatio === current.aspectRatio;
}

function areFramingEqual(previous: EditState['framing'], current: EditState['framing']): boolean {
  if (previous === current) {
    return true;
  }

  if (previous === null || current === null) {
    return previous === current;
  }

  return previous.borderWidth === current.borderWidth && previous.borderColor === current.borderColor && previous.borderRadius === current.borderRadius && previous.tapeStyle === current.tapeStyle;
}

function areCustomLutsEqual(
  previous: EditState['customLutTable'],
  current: EditState['customLutTable'],
): boolean {
  if (previous === current) {
    return true;
  }

  if (previous === null || current === null) {
    return previous === current;
  }

  if (previous.size !== current.size || previous.data.length !== current.data.length) {
    return false;
  }

  for (let index = 0; index < previous.data.length; index += 1) {
    if (previous.data[index] !== current.data[index]) {
      return false;
    }
  }

  return true;
}

function formatAdjustmentLabel(control: string): string {
  return `${control.slice(0, 1).toUpperCase()}${control.slice(1)}`;
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  emptyState: {
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
  },
  emptyText: {
    color: colors.secondary,
    textAlign: 'center',
  },
  entry: {
    gap: spacing.xs,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
  },
});
