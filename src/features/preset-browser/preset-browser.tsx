import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Preset } from '@core/lut/preset-model';
import { Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

export interface PresetBrowserProps {
  readonly presets: readonly Preset[];
  readonly categories: readonly string[];
  readonly selectedCategory: string;
  readonly selectedPresetId: string | null;
  readonly isLoading?: boolean;
  readonly onSelectCategory: (category: string) => void;
  readonly onSelectPreset: (presetId: string) => void;
}

export function PresetBrowser({
  presets,
  categories,
  selectedCategory,
  selectedPresetId,
  isLoading = false,
  onSelectCategory,
  onSelectPreset,
}: PresetBrowserProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => {
          const isSelected = category === selectedCategory;

          return (
            <Pressable
              key={category}
              accessibilityRole="button"
              onPress={() => onSelectCategory(category)}
              style={[styles.categoryChip, isSelected ? styles.categoryChipSelected : null]}
            >
              <Text
                selectable={false}
                variant="label"
                color={isSelected ? colors.background : colors.primary}
              >
                {formatCategoryLabel(category)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetsContent}
      >
        {isLoading ? (
          <View style={styles.messageCard}>
            <Text variant="caption">Loading presets…</Text>
          </View>
        ) : presets.length > 0 ? (
          presets.map((preset) => {
            const isSelected = preset.id === selectedPresetId;

            return (
              <Pressable
                key={preset.id}
                accessibilityRole="button"
                onPress={() => onSelectPreset(preset.id)}
                style={[styles.presetCard, isSelected ? styles.presetCardSelected : null]}
              >
                <View style={styles.thumbnailPlaceholder}>
                  <Text selectable={false} variant="caption" style={styles.thumbnailLabel}>
                    {preset.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text
                  selectable={false}
                  variant="label"
                  numberOfLines={1}
                  style={styles.presetName}
                >
                  {preset.name}
                </Text>
                <Text selectable={false} variant="caption" style={styles.presetMeta}>
                  {formatCategoryLabel(preset.category)}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.messageCard}>
            <Text variant="caption">No presets in this category yet.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatCategoryLabel(category: string): string {
  if (category === 'all') {
    return 'All';
  }

  return category
    .split('-')
    .map((segment) => `${segment.slice(0, 1).toUpperCase()}${segment.slice(1)}`)
    .join(' ');
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  categoriesContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  categoryChip: {
    minHeight: 36,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipSelected: {
    backgroundColor: colors.accent,
  },
  presetsContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  presetCard: {
    width: 112,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  presetCardSelected: {
    borderColor: colors.accent,
  },
  thumbnailPlaceholder: {
    aspectRatio: 1,
    borderRadius: 12,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailLabel: {
    color: colors.secondary,
    fontWeight: '700',
  },
  presetName: {
    color: colors.primary,
  },
  presetMeta: {
    color: colors.secondary,
  },
  messageCard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
