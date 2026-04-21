import React from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import type { ArtisticLookParams, ArtisticLookStyle } from '@core/stylistic/artistic-look-model';
import { ARTISTIC_LOOK_STYLES, getStylesByFamily } from '@core/stylistic/artistic-look-model';
import { BottomSheet } from '@ui/layout';
import { Button, Slider, Text } from '@ui/primitives';
import { useTheme } from '@theme/use-theme';

interface ArtisticLookSheetProps {
  readonly visible: boolean;
  readonly initialParams: ArtisticLookParams | null;
  readonly onApply: (params: ArtisticLookParams | null) => void;
  readonly onCancel: () => void;
}

const FAMILIES: readonly ArtisticLookStyle['family'][] = [
  'vintage',
  'film',
  'modern',
  'dramatic',
  'soft',
] as const;

function titleCase(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

export function ArtisticLookSheet({
  visible,
  initialParams,
  onApply,
  onCancel,
}: ArtisticLookSheetProps): React.JSX.Element {
  const theme = useTheme();
  const [activeFamily, setActiveFamily] = React.useState<ArtisticLookStyle['family']>('vintage');
  const [selectedStyleId, setSelectedStyleId] = React.useState<string | null>(null);
  const [intensity, setIntensity] = React.useState(0.5);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    const firstStyleId = ARTISTIC_LOOK_STYLES[0]?.id ?? null;
    const nextStyleId = initialParams?.styleId ?? firstStyleId;
    const nextFamily = ARTISTIC_LOOK_STYLES.find((style) => style.id === nextStyleId)?.family;

    setSelectedStyleId(nextStyleId);
    setIntensity(initialParams?.intensity ?? 0.5);
    setActiveFamily(nextFamily ?? 'vintage');
  }, [initialParams, visible]);

  const stylesByFamily = React.useMemo(
    () => getStylesByFamily(activeFamily),
    [activeFamily],
  );

  const handleClear = React.useCallback(() => {
    setSelectedStyleId(null);
    setIntensity(0.5);
  }, []);

  const handleApply = React.useCallback(() => {
    if (!selectedStyleId) {
      onApply(null);
      return;
    }

    onApply({
      styleId: selectedStyleId,
      intensity,
    });
  }, [intensity, onApply, selectedStyleId]);

  return (
    <BottomSheet visible={visible} title="Artistic Look" onClose={onCancel}>
      <View style={{ gap: theme.spacing.md }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: theme.spacing.sm }}
        >
          {FAMILIES.map((family) => {
            const isActive = family === activeFamily;
            return (
              <Pressable
                key={family}
                accessibilityRole="button"
                onPress={() => setActiveFamily(family)}
                style={({ pressed }) => [
                  styles.familyTab,
                  {
                    borderColor: isActive ? theme.colors.accent : theme.colors.border,
                    backgroundColor: isActive ? theme.colors.surfaceElevated : theme.colors.surface,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text variant="label" selectable={false}>
                  {titleCase(family)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <FlatList
          horizontal
          data={stylesByFamily}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm }}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedStyleId;
            return (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedStyleId(item.id)}
                style={({ pressed }) => [
                  styles.styleCard,
                  {
                    borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                    backgroundColor: theme.colors.surfaceElevated,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text variant="label" selectable={false}>
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />

        <Slider
          label="Intensity"
          value={intensity}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          onValueChange={setIntensity}
        />

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={styles.buttonCell}>
            <Button label="Cancel" variant="secondary" onPress={onCancel} />
          </View>
          <View style={styles.buttonCell}>
            <Button label="Clear" variant="secondary" onPress={handleClear} />
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
  familyTab: {
    minHeight: 36,
    borderRadius: 18,
    borderCurve: 'continuous',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  styleCard: {
    minWidth: 130,
    minHeight: 72,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buttonCell: {
    flex: 1,
  },
});
