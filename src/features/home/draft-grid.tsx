import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { DraftSummary } from '@core/draft';
import { colors, spacing } from '@theme/tokens';
import { IconButton, Text } from '@ui/primitives';

interface DraftGridProps {
  readonly drafts: readonly DraftSummary[];
  readonly onDraftPress: (assetId: string) => void;
  readonly onDeleteDraft: (assetId: string) => void;
}

export function DraftGrid({
  drafts,
  onDraftPress,
  onDeleteDraft,
}: DraftGridProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text variant="label">Continue Editing</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {drafts.map((draft) => (
          <Pressable
            key={draft.assetId}
            style={styles.card}
            onPress={() => onDraftPress(draft.assetId)}
          >
            {draft.previewUri ? (
              <Image source={{ uri: draft.previewUri }} style={styles.preview} />
            ) : (
              <View style={[styles.preview, styles.previewFallback]} />
            )}
            <View style={styles.cardFooter}>
              <Text variant="caption">{draft.assetId}</Text>
              <IconButton
                icon="✕"
                accessibilityLabel={`Delete ${draft.assetId}`}
                onPress={(event) => {
                  event?.stopPropagation?.();
                  onDeleteDraft(draft.assetId);
                }}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.md,
  },
  card: {
    width: 180,
    gap: spacing.sm,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    padding: spacing.sm,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
  },
  previewFallback: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
