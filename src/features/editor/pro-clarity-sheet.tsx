import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { ProClarityParams } from '@core/stylistic/pro-clarity-model';
import { DEFAULT_PRO_CLARITY } from '@core/stylistic/pro-clarity-model';
import { BottomSheet } from '@ui/layout';
import { Button, Slider, Text } from '@ui/primitives';
import { useTheme } from '@theme/use-theme';

interface ProClaritySheetProps {
  readonly visible: boolean;
  readonly initialParams: ProClarityParams | null;
  readonly onApply: (params: ProClarityParams | null) => void;
  readonly onCancel: () => void;
}

const SLIDERS: readonly {
  readonly key: keyof ProClarityParams;
  readonly label: string;
  readonly description: string;
}[] = [
  { key: 'clarity', label: 'Clarity', description: 'Enhance mid-tone contrast' },
  { key: 'sharpness', label: 'Sharpness', description: 'Sharpen edges and details' },
  { key: 'structure', label: 'Structure', description: 'Enhance texture definition' },
  { key: 'microContrast', label: 'Micro Contrast', description: 'Fine detail enhancement' },
];

export function ProClaritySheet({
  visible,
  initialParams,
  onApply,
  onCancel,
}: ProClaritySheetProps): React.JSX.Element {
  const theme = useTheme();
  const [params, setParams] = React.useState<ProClarityParams>(
    initialParams ?? DEFAULT_PRO_CLARITY,
  );

  React.useEffect(() => {
    if (!visible) {
      return;
    }
    setParams(initialParams ?? DEFAULT_PRO_CLARITY);
  }, [initialParams, visible]);

  const handleSliderChange = React.useCallback(
    (key: keyof ProClarityParams, value: number) => {
      setParams((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleReset = React.useCallback(() => {
    setParams(DEFAULT_PRO_CLARITY);
  }, []);

  const handleApply = React.useCallback(() => {
    const hasChanges = Object.values(params).some((v) => v !== 0);
    onApply(hasChanges ? params : null);
  }, [onApply, params]);

  return (
    <BottomSheet visible={visible} title="Pro Clarity" onClose={onCancel}>
      <View style={{ gap: theme.spacing.md }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.sliderScroll}
          contentContainerStyle={{ gap: theme.spacing.lg }}
        >
          {SLIDERS.map(({ key, label, description }) => (
            <View key={key}>
              <Text variant="caption">{description}</Text>
              <Slider
                label={`${label}: ${params[key].toFixed(2)}`}
                value={params[key]}
                minimumValue={-1}
                maximumValue={1}
                step={0.01}
                onValueChange={(v) => handleSliderChange(key, v)}
              />
            </View>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={styles.buttonCell}>
            <Button label="Cancel" variant="secondary" onPress={onCancel} />
          </View>
          <View style={styles.buttonCell}>
            <Button label="Reset" variant="secondary" onPress={handleReset} />
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
  sliderScroll: {
    maxHeight: 300,
  },
  buttonCell: {
    flex: 1,
  },
});
