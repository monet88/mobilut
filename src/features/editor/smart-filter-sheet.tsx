import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { SmartFilterParams } from '@core/stylistic/smart-filter-model';
import { BottomSheet } from '@ui/layout';
import { Button, Slider, Text } from '@ui/primitives';
import { useTheme } from '@theme/use-theme';

interface SmartFilterSheetProps {
  readonly visible: boolean;
  readonly initialParams: SmartFilterParams | null;
  readonly onApply: (params: SmartFilterParams | null) => void;
  readonly onCancel: () => void;
}

export function SmartFilterSheet({
  visible,
  initialParams,
  onApply,
  onCancel,
}: SmartFilterSheetProps): React.JSX.Element {
  const theme = useTheme();
  const [enabled, setEnabled] = React.useState(initialParams?.enabled ?? false);
  const [strength, setStrength] = React.useState(initialParams?.strength ?? 0.5);

  React.useEffect(() => {
    if (!visible) {
      return;
    }
    setEnabled(initialParams?.enabled ?? false);
    setStrength(initialParams?.strength ?? 0.5);
  }, [initialParams, visible]);

  const handleToggle = React.useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  const handleApply = React.useCallback(() => {
    onApply(enabled ? { enabled: true, strength } : null);
  }, [enabled, onApply, strength]);

  return (
    <BottomSheet visible={visible} title="Smart Filter" onClose={onCancel}>
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="body">
          Automatically analyzes your photo and applies optimal corrections for exposure, contrast,
          and color balance.
        </Text>

        <View style={styles.toggleRow}>
          <Text variant="label">Auto-Enhance</Text>
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: enabled }}
            onPress={handleToggle}
            style={({ pressed }) => ({
              minWidth: 72,
              minHeight: 36,
              borderRadius: 18,
              borderCurve: 'continuous',
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: enabled ? theme.colors.accent : theme.colors.surfaceElevated,
              borderColor: enabled ? theme.colors.accent : theme.colors.border,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text variant="label" selectable={false}>
              {enabled ? 'ON' : 'OFF'}
            </Text>
          </Pressable>
        </View>

        {enabled ? (
          <Slider
            label="Strength"
            value={strength}
            minimumValue={0.1}
            maximumValue={1}
            step={0.01}
            onValueChange={setStrength}
          />
        ) : null}

        <Text variant="caption">
          Uses deterministic algorithms — no AI or cloud processing.
        </Text>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={styles.buttonCell}>
            <Button label="Cancel" variant="secondary" onPress={onCancel} />
          </View>
          <View style={styles.buttonCell}>
            <Button label="Apply" onPress={handleApply} />
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonCell: {
    flex: 1,
  },
});
