import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';

import type { LibraryAlbum, LibraryPhotoAsset } from '@adapters/expo/media-library';
import {
  getAlbumPhotoAssets,
  getAlbums,
  getRecentPhotoAssets,
  requestPhotoLibraryPermission,
} from '@adapters/expo/media-library';
import { BottomSheet } from '@ui/layout';
import { Text } from '@ui/primitives';
import { MAX_BATCH_PHOTOS } from '@core/batch';
import { colors, spacing } from '@theme/tokens';

interface BatchPhotoPickerProps {
  readonly visible: boolean;
  readonly currentCount: number;
  readonly onSelect: (assets: readonly LibraryPhotoAsset[]) => void;
  readonly onClose: () => void;
}

type TabType = 'recent' | 'albums';

export function BatchPhotoPicker({
  visible,
  currentCount,
  onSelect,
  onClose,
}: BatchPhotoPickerProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [recentAssets, setRecentAssets] = useState<readonly LibraryPhotoAsset[]>([]);
  const [albums, setAlbums] = useState<readonly LibraryAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<LibraryAlbum | null>(null);
  const [albumAssets, setAlbumAssets] = useState<readonly LibraryPhotoAsset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Record<string, LibraryPhotoAsset>>({});
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const maxSelectable = MAX_BATCH_PHOTOS - currentCount;
  const selectedCount = Object.keys(selectedAssets).length;

  const resetPickerState = useCallback(() => {
    setActiveTab('recent');
    setSelectedAlbum(null);
    setAlbumAssets([]);
    setSelectedAssets({});
  }, []);

  useEffect(() => {
    if (!visible) {
      resetPickerState();
      return;
    }

    void (async () => {
      const permission = await requestPhotoLibraryPermission();
      setHasPermission(permission.granted);
      if (permission.granted) {
        setRecentAssets(await getRecentPhotoAssets());
        setAlbums(await getAlbums());
      }
    })();
  }, [resetPickerState, visible]);

  useEffect(() => {
    if (!selectedAlbum) return;
    void (async () => {
      setAlbumAssets(await getAlbumPhotoAssets(selectedAlbum));
    })();
  }, [selectedAlbum]);

  const handleToggleSelect = useCallback(
    (asset: LibraryPhotoAsset) => {
      setSelectedAssets((prev) => {
        if (prev[asset.id]) {
          const { [asset.id]: _removed, ...remaining } = prev;
          return remaining;
        }

        if (Object.keys(prev).length >= maxSelectable) {
          return prev;
        }

        return {
          ...prev,
          [asset.id]: asset,
        };
      });
    },
    [maxSelectable],
  );

  const handleConfirm = useCallback(() => {
    onSelect(Object.values(selectedAssets));
    resetPickerState();
    onClose();
  }, [onClose, onSelect, resetPickerState, selectedAssets]);

  const handleBack = useCallback(() => {
    if (selectedAlbum) {
      setSelectedAlbum(null);
      setAlbumAssets([]);
    } else {
      onClose();
    }
  }, [selectedAlbum, onClose]);

  const renderAlbumItem = useCallback(
    ({ item }: { item: LibraryAlbum }) => (
      <Pressable
        style={styles.albumCard}
        onPress={() => setSelectedAlbum(item)}
        accessibilityRole="button"
        accessibilityLabel={`Album ${item.title}`}
      >
        <View style={styles.albumIcon} />
        <Text style={styles.albumName} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.albumCount}>{`${item.assetCount} photos`}</Text>
      </Pressable>
    ),
    [],
  );

  const renderPhotoItem = useCallback(
    ({ item, index }: { item: LibraryPhotoAsset; index: number }) => {
      const isSelected = Boolean(selectedAssets[item.id]);

      return (
        <Pressable
          style={[styles.photoCard, isSelected && styles.photoCardSelected]}
          onPress={() => handleToggleSelect(item)}
          accessibilityRole="button"
          accessibilityLabel={`Photo, ${isSelected ? 'selected' : 'not selected'}`}
        >
          <Image source={{ uri: item.uri }} style={styles.photoThumb} />
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          )}
          <View style={styles.indexBadge}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
        </Pressable>
      );
    },
    [handleToggleSelect, selectedAssets],
  );

  if (hasPermission === null) {
    return (
      <BottomSheet visible={visible} onClose={onClose}>
        <View />
      </BottomSheet>
    );
  }

  if (!hasPermission) {
    return (
      <BottomSheet visible={visible} onClose={onClose}>
        <Text style={styles.permissionText}>
          Photo library access is required to select photos for batch processing.
        </Text>
      </BottomSheet>
    );
  }

  const displayAssets = activeTab === 'recent' ? recentAssets : albumAssets;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.navBtnText}>←</Text>
        </Pressable>
        <Text style={styles.title}>
          {`Select Photos (${selectedCount}/${maxSelectable})`}
        </Text>
        <Pressable
          onPress={handleConfirm}
          disabled={selectedCount === 0}
          style={[styles.navBtn, selectedCount === 0 && styles.navBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Confirm selection"
        >
          <Text style={styles.navBtnText}>✓</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
          accessibilityRole="tab"
          accessibilityLabel="Recent photos tab"
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
            Recent
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'albums' && styles.tabActive]}
          onPress={() => setActiveTab('albums')}
          accessibilityRole="tab"
          accessibilityLabel="Albums tab"
        >
          <Text style={[styles.tabText, activeTab === 'albums' && styles.tabTextActive]}>
            Albums
          </Text>
        </Pressable>
      </View>

      {activeTab === 'albums' && !selectedAlbum ? (
        <FlatList
          key="album-grid"
          data={albums}
          keyExtractor={(item) => item.id}
          numColumns={2}
          style={styles.list}
          renderItem={renderAlbumItem}
        />
      ) : (
        <FlatList
          key="photo-grid"
          data={displayAssets}
          keyExtractor={(item) => item.id}
          numColumns={4}
          style={styles.list}
          renderItem={renderPhotoItem}
        />
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  navBtn: { padding: spacing.xs },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { color: colors.primary, fontSize: 18 },
  title: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  tabs: { flexDirection: 'row', marginBottom: spacing.sm },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.accent },
  tabText: { color: colors.secondary, fontSize: 14 },
  tabTextActive: { color: colors.primary },
  permissionText: {
    color: colors.secondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  list: { maxHeight: 300 },
  albumCard: {
    flex: 1,
    margin: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
  },
  albumIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 4,
  },
  albumName: { color: colors.primary, fontSize: 12, marginTop: spacing.xs },
  albumCount: { color: colors.secondary, fontSize: 10 },
  photoCard: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  photoCardSelected: { borderColor: colors.accent },
  photoThumb: { width: '100%', height: '100%' },
  indexBadge: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
  },
  indexText: { color: colors.primary, fontSize: 10 },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.accent,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
});
