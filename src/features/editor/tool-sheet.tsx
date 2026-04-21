import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@ui/layout';
import { Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

export type EditorSheetKey = 'crop' | 'adjust' | 'lut' | 'log' | 'export' | 'frame' | 'smart-filter' | 'pro-clarity' | 'artistic-look' | 'blend';

interface ToolSheetItem {
  readonly label: string;
  readonly sheet: EditorSheetKey | null;
  readonly disabled?: boolean;
}

const TOOL_ITEMS: readonly ToolSheetItem[] = [
  { label: 'Crop', sheet: 'crop' },
  { label: 'Adjust', sheet: 'adjust' },
  { label: 'LUT', sheet: 'lut' },
  { label: 'Smart', sheet: 'smart-filter' },
  { label: 'Pro', sheet: 'pro-clarity' },
  { label: 'Art', sheet: 'artistic-look' },
  { label: 'Border', sheet: 'frame' },
  { label: 'Blend', sheet: 'blend' },
  { label: 'Frame', sheet: 'frame' },
] as const;

export interface ToolSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelectTool: (sheet: EditorSheetKey) => void;
}

export function ToolSheet({ visible, onClose, onSelectTool }: ToolSheetProps): React.JSX.Element {
  return (
    <BottomSheet visible={visible} title="Tools" onClose={onClose}>
      <View style={styles.grid}>
        {TOOL_ITEMS.map((item) => {
          const isDisabled = item.disabled === true || item.sheet === null;

          return (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              disabled={isDisabled}
              onPress={() => {
                if (item.sheet === null) {
                  return;
                }

                onSelectTool(item.sheet);
              }}
              style={({ pressed }) => [
                styles.card,
                isDisabled ? styles.cardDisabled : null,
                !isDisabled && pressed ? styles.cardPressed : null,
              ]}
            >
              <Text
                selectable={false}
                variant="label"
                color={isDisabled ? colors.secondary : colors.primary}
              >
                {item.label}
              </Text>
              <Text
                selectable={false}
                variant="caption"
                color={isDisabled ? colors.secondary : colors.accent}
              >
                {isDisabled ? 'Soon' : 'Open'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    minHeight: 88,
    width: '23.5%',
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardPressed: {
    opacity: 0.85,
    borderColor: colors.accent,
  },
});
