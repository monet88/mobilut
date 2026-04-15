import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { EditAction } from '@core/edit-session/edit-action';
import type { FramingParams } from '@core/edit-session/edit-state';
import { Button, Slider, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

import { useFraming } from './use-framing';

export interface FramingPanelProps {
  readonly framing: FramingParams | null;
  readonly dispatch: (action: EditAction) => void;
}

const DEFAULT_FRAMING: FramingParams = {
  borderWidth: 0.08,
  borderColor: '#FFFFFF',
  borderRadius: 16,
  tapeStyle: null,
};

const BORDER_COLORS = ['#FFFFFF', '#F5E6C8', '#D7E9FF', '#F8D7DA'] as const;
const TAPE_STYLES = ['Classic', 'Polaroid', 'Masking'] as const;

export function FramingPanel({ framing, dispatch }: FramingPanelProps): React.JSX.Element {
  const { setFraming, clearFraming } = useFraming(dispatch);
  const currentFraming = framing ?? DEFAULT_FRAMING;

  const updateFraming = React.useCallback(
    (updates: Partial<FramingParams>) => {
      setFraming({
        ...currentFraming,
        ...updates,
      });
    },
    [currentFraming, setFraming],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="label">Framing</Text>
        <Button label="Clear" onPress={clearFraming} variant="secondary" />
      </View>

      <View style={styles.panel}>
        <Text variant="caption">
          Adjust border width, border color, border radius, and tape style with a live framing
          preview.
        </Text>

        <View style={styles.previewFrame}>
          <View
            style={[
              styles.previewOuter,
              {
                padding: Math.max(8, currentFraming.borderWidth * 80),
                backgroundColor: currentFraming.borderColor,
                borderRadius: currentFraming.borderRadius,
              },
            ]}
          >
            {currentFraming.tapeStyle ? <View style={[styles.tape, styles.tapeLeft]} /> : null}
            {currentFraming.tapeStyle ? <View style={[styles.tape, styles.tapeRight]} /> : null}
            <View
              style={[
                styles.previewInner,
                {
                  borderRadius: Math.max(0, currentFraming.borderRadius - 6),
                },
              ]}
            />
          </View>
        </View>

        <Slider
          label="Border width"
          value={currentFraming.borderWidth}
          minimumValue={0}
          maximumValue={0.2}
          step={0.01}
          onValueChange={(value) => updateFraming({ borderWidth: value })}
        />
        <Slider
          label="Border radius"
          value={currentFraming.borderRadius}
          minimumValue={0}
          maximumValue={40}
          step={1}
          onValueChange={(value) => updateFraming({ borderRadius: value })}
        />

        <View style={styles.optionGroup}>
          <Text variant="label">Border color</Text>
          <View style={styles.colorRow}>
            {BORDER_COLORS.map((borderColor) => {
              const isSelected = currentFraming.borderColor === borderColor;

              return (
                <Pressable
                  key={borderColor}
                  accessibilityRole="button"
                  onPress={() => updateFraming({ borderColor })}
                  style={[
                    styles.colorSwatch,
                    isSelected ? styles.colorSwatchSelected : null,
                    { backgroundColor: borderColor },
                  ]}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.optionGroup}>
          <Text variant="label">Tape style</Text>
          <View style={styles.tapeRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => updateFraming({ tapeStyle: null })}
              style={[
                styles.tapeChip,
                currentFraming.tapeStyle === null ? styles.tapeChipSelected : null,
              ]}
            >
              <Text
                selectable={false}
                variant="label"
                color={currentFraming.tapeStyle === null ? colors.background : colors.primary}
              >
                None
              </Text>
            </Pressable>
            {TAPE_STYLES.map((tapeStyle) => {
              const isSelected = currentFraming.tapeStyle === tapeStyle;

              return (
                <Pressable
                  key={tapeStyle}
                  accessibilityRole="button"
                  onPress={() => updateFraming({ tapeStyle })}
                  style={[styles.tapeChip, isSelected ? styles.tapeChipSelected : null]}
                >
                  <Text
                    selectable={false}
                    variant="label"
                    color={isSelected ? colors.background : colors.primary}
                  >
                    {tapeStyle}
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
  previewFrame: {
    alignItems: 'center',
  },
  previewOuter: {
    width: '100%',
    maxWidth: 220,
    aspectRatio: 1,
    position: 'relative',
  },
  previewInner: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tape: {
    position: 'absolute',
    top: -10,
    width: 36,
    height: 18,
    borderRadius: 8,
    borderCurve: 'continuous',
    backgroundColor: 'rgba(245, 230, 200, 0.85)',
    zIndex: 1,
  },
  tapeLeft: {
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  tapeRight: {
    right: 20,
    transform: [{ rotate: '15deg' }],
  },
  optionGroup: {
    gap: spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: colors.accent,
  },
  tapeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tapeChip: {
    minHeight: 38,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  tapeChipSelected: {
    backgroundColor: colors.accent,
  },
});
