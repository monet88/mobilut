import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@ui/primitives';
import type { BatchPhoto } from '@core/batch';
import { colors, spacing } from '@theme/tokens';

interface BatchThumbnailStripProps {
  readonly photos: readonly BatchPhoto[];
  readonly selectedId: string | null;
  readonly onSelect: (photoId: string) => void;
  readonly onAdd: () => void;
  readonly onRemove: (photoId: string) => void;
}

export function BatchThumbnailStrip({
  photos,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
}: BatchThumbnailStripProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Pressable
            style={styles.addButton}
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel="Add photos"
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        }
        renderItem={({ item, index }) => (
          <Pressable
            style={[styles.thumbnail, selectedId === item.id && styles.thumbnailSelected]}
            onPress={() => onSelect(item.id)}
            onLongPress={() => onRemove(item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Photo ${index + 1}, ${item.status}`}
          >
            <Image
              source={{ uri: item.thumbnailUri ?? item.uri }}
              style={styles.thumbnailImage}
            />
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            {item.status === 'completed' && (
              <View style={[styles.statusDot, styles.statusDotSuccess]} />
            )}
            {item.status === 'failed' && (
              <View style={[styles.statusDot, styles.statusDotError]} />
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 72, backgroundColor: colors.surface },
  listContent: { paddingHorizontal: spacing.sm, alignItems: 'center' },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  addButtonText: { color: colors.primary, fontSize: 24 },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: spacing.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: { borderColor: colors.accent },
  thumbnailImage: { width: '100%', height: '100%' },
  indexBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  indexText: { color: colors.primary, fontSize: 10 },
  statusDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotSuccess: { backgroundColor: colors.success },
  statusDotError: { backgroundColor: colors.error },
});
