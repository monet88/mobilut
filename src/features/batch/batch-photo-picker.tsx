import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { BottomSheet } from '@ui/layout';
import { Text } from '@ui/primitives';
import { MAX_BATCH_PHOTOS } from '@core/batch';
import { colors, spacing } from '@theme/tokens';

interface BatchPhotoPickerProps {
  readonly visible: boolean;
  readonly currentCount: number;
  readonly onSelect: (assets: MediaLibrary.Asset[]) => void;
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
  const [recentAssets, setRecentAssets] = useState<MediaLibrary.Asset[]>([]);
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<MediaLibrary.Album | null>(null);
  const [albumAssets, setAlbumAssets] = useState<MediaLibrary.Asset[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const maxSelectable = MAX_BATCH_PHOTOS - currentCount;

  useEffect(() => {
    if (!visible) return;
    void (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        const recent = await MediaLibrary.getAssetsAsync({
          first: 100,
          mediaType: 'photo',
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });
        setRecentAssets(recent.assets);
        const albumList = await MediaLibrary.getAlbumsAsync();
        setAlbums(albumList);
      }
    })();
  }, [visible]);

  useEffect(() => {
    if (!selectedAlbum) return;
    void (async () => {
      const assets = await MediaLibrary.getAssetsAsync({
        first: 100,
        album: selectedAlbum,
        mediaType: 'photo',
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });
      setAlbumAssets(assets.assets);
    })();
  }, [selectedAlbum]);

  const handleToggleSelect = useCallback(
    (asset: MediaLibrary.Asset) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(asset.id)) {
          next.delete(asset.id);
        } else if (next.size < maxSelectable) {
          next.add(asset.id);
        }
        return next;
      });
    },
    [maxSelectable],
  );

  const handleConfirm = useCallback(() => {
    const assets = activeTab === 'recent' ? recentAssets : albumAssets;
    const selected = assets.filter((a) => selectedIds.has(a.id));
    onSelect(selected);
    setSelectedIds(new Set());
    onClose();
  }, [activeTab, recentAssets, albumAssets, selectedIds, onSelect, onClose]);

  const handleBack = useCallback(() => {
    if (selectedAlbum) {
      setSelectedAlbum(null);
      setAlbumAssets([]);
    } else {
      onClose();
    }
  }, [selectedAlbum, onClose]);

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
          {`Select Photos (${selectedIds.size}/${maxSelectable})`}
        </Text>
        <Pressable
          onPress={handleConfirm}
          disabled={selectedIds.size === 0}
          style={[styles.navBtn, selectedIds.size === 0 && styles.navBtnDisabled]}
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
          data={albums}
          keyExtractor={(item) => item.id}
          numColumns={2}
          style={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.albumCard}
              onPress={() => setSelectedAlbum(item)}
              accessibilityRole="button"
              accessibilityLabel={`Album ${item.title}`}
            >
              <View style={styles.albumIcon} />
              <Text style={styles.albumName} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.albumCount}>{`${item.assetCount} photos`}</Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={displayAssets}
          keyExtractor={(item) => item.id}
          numColumns={4}
          style={styles.list}
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);
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
              </Pressable>
            );
          }}
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
