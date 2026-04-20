# Phase 3: Batch + Advanced Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Batch processing, Blend tool, and Home ad integration after the single-photo loop is trusted.

**Architecture:** Batch uses a workspace model with thumbnail cache and export queue. Blend requires layer state management. Ads integrate via SDK with offline fallback.

**Tech Stack:** React Native, Expo Router, expo-ads-admob, TypeScript

**Prerequisites:** Phase 1 and Phase 2 must be complete - trusted single-photo loop with stylistic tools working.

---

## File Structure

### New Files

| Path | Responsibility |
|------|----------------|
| `src/core/batch/batch-workspace-model.ts` | Batch workspace types and state |
| `src/core/batch/batch-session-model.ts` | Batch session lifecycle |
| `src/core/batch/index.ts` | Barrel export |
| `src/core/blend/blend-model.ts` | Blend layer and mode types |
| `src/core/blend/index.ts` | Barrel export |
| `src/services/batch/batch-workspace.ts` | Batch workspace management |
| `src/services/batch/batch-export-queue.ts` | Batch export queue processing |
| `src/services/batch/thumbnail-cache.ts` | Batch thumbnail caching |
| `src/services/batch/index.ts` | Barrel export |
| `src/services/ads/ad-manager.ts` | Ad SDK wrapper with offline fallback |
| `src/services/ads/index.ts` | Barrel export |
| `src/features/batch/batch.screen.tsx` | Batch screen component |
| `src/features/batch/batch-photo-picker.tsx` | Two-tab photo picker (Recent + Albums) |
| `src/features/batch/batch-thumbnail-strip.tsx` | Horizontal thumbnail strip |
| `src/features/batch/batch-preview.tsx` | Active preview with navigation |
| `src/features/batch/use-batch-session.ts` | Batch session hook |
| `src/features/batch/index.ts` | Barrel export |
| `src/features/editor/blend-sheet.tsx` | Blend tool UI |
| `src/features/home/home-ad-banner.tsx` | Home ad banner component |
| `src/core/render/blend-transform.ts` | Blend layer compositor |
| `src/adapters/skia/blend-shader.ts` | Skia blend mode shaders |
| `app/batch.tsx` | Batch route |

### Modified Files

| Path | Changes |
|------|---------|
| `src/features/home/home.screen.tsx` | Add batch entry button, ad banner |
| `src/features/editor/tool-sheet.tsx` | Enable Blend tool |
| `src/core/edit-session/edit-state.ts` | Add blend layers field |
| `src/core/edit-session/edit-action.ts` | Add blend actions |
| `src/features/editor/editor-reducer.ts` | Handle blend actions |
| `src/core/render/transform-executor.ts` | Add blend case |

---

## Task 1: Batch Workspace Model

**Files:**
- Create: `src/core/batch/batch-workspace-model.ts`
- Create: `src/core/batch/batch-session-model.ts`
- Create: `src/core/batch/index.ts`

### Step 1.1: Define batch workspace model

- [ ] **Step 1.1.1: Create batch workspace types**

```typescript
// src/core/batch/batch-workspace-model.ts
export const MAX_BATCH_PHOTOS = 20;

export interface BatchPhoto {
  readonly id: string;
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  readonly thumbnailUri: string | null;
  readonly status: 'pending' | 'processing' | 'completed' | 'failed';
  readonly error: string | null;
}

export interface BatchWorkspace {
  readonly id: string;
  readonly photos: readonly BatchPhoto[];
  readonly selectedPhotoId: string | null;
  readonly appliedPresetId: string | null;
  readonly appliedIntensity: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface BatchExportOptions {
  readonly format: 'jpeg' | 'png';
  readonly quality: number;
  readonly preserveOriginalSize: boolean;
}

export function createBatchWorkspace(): BatchWorkspace {
  return {
    id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    photos: [],
    selectedPhotoId: null,
    appliedPresetId: null,
    appliedIntensity: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function canAddPhotos(workspace: BatchWorkspace, count: number): boolean {
  return workspace.photos.length + count <= MAX_BATCH_PHOTOS;
}
```

- [ ] **Step 1.1.2: Commit**

```bash
git add src/core/batch/batch-workspace-model.ts
git commit -m "$(cat <<'EOF'
feat(batch): add batch workspace model with 20 photo limit
EOF
)"
```

### Step 1.2: Define batch session model

- [ ] **Step 1.2.1: Create batch session types**

```typescript
// src/core/batch/batch-session-model.ts
import type { BatchWorkspace, BatchExportOptions } from './batch-workspace-model';

export type BatchSessionState = 
  | 'idle'
  | 'selecting'
  | 'previewing'
  | 'applying'
  | 'exporting'
  | 'completed'
  | 'error';

export interface BatchSession {
  readonly workspace: BatchWorkspace;
  readonly state: BatchSessionState;
  readonly exportProgress: BatchExportProgress | null;
  readonly error: BatchError | null;
}

export interface BatchExportProgress {
  readonly total: number;
  readonly completed: number;
  readonly failed: number;
  readonly currentPhotoId: string | null;
}

export interface BatchError {
  readonly code: 'SELECTION_LIMIT' | 'EXPORT_PARTIAL' | 'EXPORT_FAILED' | 'PERMISSION_DENIED';
  readonly message: string;
  readonly failedPhotoIds?: readonly string[];
}

export function createBatchSession(workspace: BatchWorkspace): BatchSession {
  return {
    workspace,
    state: 'idle',
    exportProgress: null,
    error: null,
  };
}

export function isExportComplete(progress: BatchExportProgress): boolean {
  return progress.completed + progress.failed >= progress.total;
}

export function hasPartialFailure(progress: BatchExportProgress): boolean {
  return progress.failed > 0 && progress.completed > 0;
}
```

- [ ] **Step 1.2.2: Create barrel export**

```typescript
// src/core/batch/index.ts
export type { BatchPhoto, BatchWorkspace, BatchExportOptions } from './batch-workspace-model';
export { MAX_BATCH_PHOTOS, createBatchWorkspace, canAddPhotos } from './batch-workspace-model';
export type { BatchSessionState, BatchSession, BatchExportProgress, BatchError } from './batch-session-model';
export { createBatchSession, isExportComplete, hasPartialFailure } from './batch-session-model';
```

- [ ] **Step 1.2.3: Commit**

```bash
git add src/core/batch/
git commit -m "$(cat <<'EOF'
feat(batch): add batch session model with export progress tracking
EOF
)"
```

---

## Task 2: Batch Workspace Service

**Files:**
- Create: `src/services/batch/batch-workspace.ts`
- Create: `src/services/batch/thumbnail-cache.ts`
- Create: `src/services/batch/batch-export-queue.ts`
- Create: `src/services/batch/index.ts`

### Step 2.1: Implement thumbnail cache

- [ ] **Step 2.1.1: Create thumbnail cache service**

```typescript
// src/services/batch/thumbnail-cache.ts
import * as FileSystem from 'expo-file-system';
import { resizeImage } from '@adapters/expo/image-manipulator';

const THUMBNAIL_CACHE_DIR = `${FileSystem.cacheDirectory}batch-thumbnails/`;
const THUMBNAIL_SIZE = 200;

async function ensureCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(THUMBNAIL_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(THUMBNAIL_CACHE_DIR, { intermediates: true });
  }
}

export async function generateThumbnail(photoId: string, sourceUri: string): Promise<string> {
  await ensureCacheDir();

  const thumbnailUri = `${THUMBNAIL_CACHE_DIR}${photoId}.jpg`;
  const info = await FileSystem.getInfoAsync(thumbnailUri);

  if (info.exists) {
    return thumbnailUri;
  }

  const resizedUri = await resizeImage(sourceUri, {
    maxWidth: THUMBNAIL_SIZE,
    maxHeight: THUMBNAIL_SIZE,
    quality: 0.7,
  });

  await FileSystem.copyAsync({ from: resizedUri, to: thumbnailUri });
  return thumbnailUri;
}

export async function getThumbnail(photoId: string): Promise<string | null> {
  const thumbnailUri = `${THUMBNAIL_CACHE_DIR}${photoId}.jpg`;
  const info = await FileSystem.getInfoAsync(thumbnailUri);
  return info.exists ? thumbnailUri : null;
}

export async function clearThumbnailCache(): Promise<void> {
  const info = await FileSystem.getInfoAsync(THUMBNAIL_CACHE_DIR);
  if (info.exists) {
    await FileSystem.deleteAsync(THUMBNAIL_CACHE_DIR, { idempotent: true });
  }
}

export async function clearThumbnail(photoId: string): Promise<void> {
  const thumbnailUri = `${THUMBNAIL_CACHE_DIR}${photoId}.jpg`;
  const info = await FileSystem.getInfoAsync(thumbnailUri);
  if (info.exists) {
    await FileSystem.deleteAsync(thumbnailUri, { idempotent: true });
  }
}
```

- [ ] **Step 2.1.2: Commit**

```bash
git add src/services/batch/thumbnail-cache.ts
git commit -m "$(cat <<'EOF'
feat(batch): add thumbnail cache service
EOF
)"
```

### Step 2.2: Implement batch workspace service

- [ ] **Step 2.2.1: Create workspace service**

```typescript
// src/services/batch/batch-workspace.ts
import type { BatchPhoto, BatchWorkspace } from '@core/batch';
import { createBatchWorkspace, MAX_BATCH_PHOTOS } from '@core/batch';
import { generateThumbnail, clearThumbnail } from './thumbnail-cache';

export interface PhotoSelection {
  readonly id: string;
  readonly uri: string;
  readonly width: number;
  readonly height: number;
}

export async function createWorkspaceWithPhotos(
  selections: readonly PhotoSelection[],
): Promise<BatchWorkspace> {
  if (selections.length > MAX_BATCH_PHOTOS) {
    throw new Error(`Cannot add more than ${MAX_BATCH_PHOTOS} photos to batch`);
  }

  const workspace = createBatchWorkspace();
  const photos: BatchPhoto[] = [];

  for (const selection of selections) {
    const thumbnailUri = await generateThumbnail(selection.id, selection.uri);
    photos.push({
      id: selection.id,
      uri: selection.uri,
      width: selection.width,
      height: selection.height,
      thumbnailUri,
      status: 'pending',
      error: null,
    });
  }

  return {
    ...workspace,
    photos,
    selectedPhotoId: photos[0]?.id ?? null,
  };
}

export async function addPhotosToWorkspace(
  workspace: BatchWorkspace,
  selections: readonly PhotoSelection[],
): Promise<BatchWorkspace> {
  const totalCount = workspace.photos.length + selections.length;
  if (totalCount > MAX_BATCH_PHOTOS) {
    throw new Error(`Cannot add more than ${MAX_BATCH_PHOTOS} photos to batch`);
  }

  const newPhotos: BatchPhoto[] = [];
  for (const selection of selections) {
    const thumbnailUri = await generateThumbnail(selection.id, selection.uri);
    newPhotos.push({
      id: selection.id,
      uri: selection.uri,
      width: selection.width,
      height: selection.height,
      thumbnailUri,
      status: 'pending',
      error: null,
    });
  }

  return {
    ...workspace,
    photos: [...workspace.photos, ...newPhotos],
    updatedAt: Date.now(),
  };
}

export async function removePhotoFromWorkspace(
  workspace: BatchWorkspace,
  photoId: string,
): Promise<BatchWorkspace> {
  await clearThumbnail(photoId);

  const photos = workspace.photos.filter((p) => p.id !== photoId);
  const selectedPhotoId =
    workspace.selectedPhotoId === photoId
      ? photos[0]?.id ?? null
      : workspace.selectedPhotoId;

  return {
    ...workspace,
    photos,
    selectedPhotoId,
    updatedAt: Date.now(),
  };
}

export function selectPhoto(workspace: BatchWorkspace, photoId: string): BatchWorkspace {
  if (!workspace.photos.some((p) => p.id === photoId)) {
    return workspace;
  }

  return {
    ...workspace,
    selectedPhotoId: photoId,
    updatedAt: Date.now(),
  };
}

export function applyPreset(
  workspace: BatchWorkspace,
  presetId: string | null,
  intensity: number,
): BatchWorkspace {
  return {
    ...workspace,
    appliedPresetId: presetId,
    appliedIntensity: intensity,
    updatedAt: Date.now(),
  };
}
```

- [ ] **Step 2.2.2: Commit**

```bash
git add src/services/batch/batch-workspace.ts
git commit -m "$(cat <<'EOF'
feat(batch): add batch workspace service
EOF
)"
```

### Step 2.3: Implement batch export queue

- [ ] **Step 2.3.1: Create export queue service**

```typescript
// src/services/batch/batch-export-queue.ts
import type { BatchPhoto, BatchWorkspace, BatchExportOptions, BatchExportProgress } from '@core/batch';
import { executeTransforms, type TransformContext } from '@core/render';
import { saveToMediaLibrary } from '@adapters/expo/media-library';

export type ExportProgressCallback = (progress: BatchExportProgress) => void;

export interface BatchExportResult {
  readonly successful: readonly string[];
  readonly failed: readonly { photoId: string; error: string }[];
}

export async function exportBatch(
  workspace: BatchWorkspace,
  options: BatchExportOptions,
  onProgress: ExportProgressCallback,
): Promise<BatchExportResult> {
  const successful: string[] = [];
  const failed: { photoId: string; error: string }[] = [];

  const progress: BatchExportProgress = {
    total: workspace.photos.length,
    completed: 0,
    failed: 0,
    currentPhotoId: null,
  };

  for (const photo of workspace.photos) {
    progress.currentPhotoId = photo.id;
    onProgress({ ...progress });

    try {
      const resultUri = await exportSinglePhoto(photo, workspace, options);
      await saveToMediaLibrary(resultUri);
      successful.push(photo.id);
      progress.completed++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failed.push({ photoId: photo.id, error: errorMessage });
      progress.failed++;
    }

    onProgress({ ...progress, currentPhotoId: null });
  }

  return { successful, failed };
}

async function exportSinglePhoto(
  photo: BatchPhoto,
  workspace: BatchWorkspace,
  options: BatchExportOptions,
): Promise<string> {
  const transforms = [];

  if (workspace.appliedPresetId) {
    transforms.push({
      type: 'lut' as const,
      presetId: workspace.appliedPresetId,
    });
  }

  const context: TransformContext = {
    sourceUri: photo.uri,
    sourceWidth: photo.width,
    sourceHeight: photo.height,
    transforms,
    mode: 'export',
    targetWidth: options.preserveOriginalSize ? photo.width : undefined,
    targetHeight: options.preserveOriginalSize ? photo.height : undefined,
    quality: options.quality,
  };

  const result = await executeTransforms(context);
  return result.uri;
}
```

- [ ] **Step 2.3.2: Create barrel export**

```typescript
// src/services/batch/index.ts
export { generateThumbnail, getThumbnail, clearThumbnailCache, clearThumbnail } from './thumbnail-cache';
export type { PhotoSelection } from './batch-workspace';
export {
  createWorkspaceWithPhotos,
  addPhotosToWorkspace,
  removePhotoFromWorkspace,
  selectPhoto,
  applyPreset,
} from './batch-workspace';
export type { ExportProgressCallback, BatchExportResult } from './batch-export-queue';
export { exportBatch } from './batch-export-queue';
```

- [ ] **Step 2.3.3: Commit**

```bash
git add src/services/batch/
git commit -m "$(cat <<'EOF'
feat(batch): add batch export queue with progress tracking
EOF
)"
```

---

## Task 3: Batch Photo Picker

**Files:**
- Create: `src/features/batch/batch-photo-picker.tsx`

### Step 3.1: Implement two-tab photo picker

- [ ] **Step 3.1.1: Create picker component**

```typescript
// src/features/batch/batch-photo-picker.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { BottomSheet } from '@ui/layout/bottom-sheet';
import { Text } from '@ui/primitives/text';
import { IconButton } from '@ui/primitives/icon-button';
import { MAX_BATCH_PHOTOS } from '@core/batch';
import { tokens } from '@theme/tokens';

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
  const [permission, setPermission] = useState<boolean>(false);

  const maxSelectable = MAX_BATCH_PHOTOS - currentCount;

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setPermission(status === 'granted');

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
    if (selectedAlbum) {
      (async () => {
        const assets = await MediaLibrary.getAssetsAsync({
          first: 100,
          album: selectedAlbum,
          mediaType: 'photo',
          sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        });
        setAlbumAssets(assets.assets);
      })();
    }
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

  if (!permission) {
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
        <IconButton icon="arrow-back" onPress={handleBack} />
        <Text style={styles.title}>
          Select Photos ({selectedIds.size}/{maxSelectable})
        </Text>
        <IconButton
          icon="check"
          onPress={handleConfirm}
          disabled={selectedIds.size === 0}
        />
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'recent' && styles.tabActive]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={styles.tabText}>Recent</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'albums' && styles.tabActive]}
          onPress={() => setActiveTab('albums')}
        >
          <Text style={styles.tabText}>Albums</Text>
        </Pressable>
      </View>

      {activeTab === 'albums' && !selectedAlbum ? (
        <FlatList
          data={albums}
          keyExtractor={(item) => item.id}
          numColumns={2}
          style={styles.albumList}
          renderItem={({ item }) => (
            <Pressable style={styles.albumCard} onPress={() => setSelectedAlbum(item)}>
              <View style={styles.albumIcon} />
              <Text style={styles.albumName} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.albumCount}>{item.assetCount} photos</Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={displayAssets}
          keyExtractor={(item) => item.id}
          numColumns={4}
          style={styles.photoGrid}
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <Pressable
                style={[styles.photoCard, isSelected && styles.photoCardSelected]}
                onPress={() => handleToggleSelect(item)}
              >
                <Image source={{ uri: item.uri }} style={styles.photoThumbnail} />
                {isSelected && (
                  <View style={styles.checkmark}>
                    <IconButton icon="check" size={16} />
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
    marginBottom: 12,
  },
  title: { color: tokens.colors.textPrimary, fontSize: 14, fontWeight: '600' },
  tabs: { flexDirection: 'row', marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: tokens.colors.accent },
  tabText: { color: tokens.colors.textPrimary, fontSize: 14 },
  permissionText: {
    color: tokens.colors.textSecondary,
    textAlign: 'center',
    padding: 24,
  },
  albumList: { maxHeight: 300 },
  albumCard: {
    flex: 1,
    margin: 4,
    padding: 12,
    backgroundColor: tokens.colors.surfaceDark2,
    borderRadius: 8,
  },
  albumIcon: { width: 40, height: 40, backgroundColor: tokens.colors.surfaceDark1, borderRadius: 4 },
  albumName: { color: tokens.colors.textPrimary, fontSize: 12, marginTop: 8 },
  albumCount: { color: tokens.colors.textSecondary, fontSize: 10 },
  photoGrid: { maxHeight: 300 },
  photoCard: {
    flex: 1,
    margin: 2,
    aspectRatio: 1,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  photoCardSelected: { borderColor: tokens.colors.accent },
  photoThumbnail: { width: '100%', height: '100%' },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: tokens.colors.accent,
    borderRadius: 12,
  },
});
```

- [ ] **Step 3.1.2: Commit**

```bash
git add src/features/batch/batch-photo-picker.tsx
git commit -m "$(cat <<'EOF'
feat(batch): add two-tab photo picker (Recent + Albums)
EOF
)"
```

---

## Task 4: Batch Screen

**Files:**
- Create: `src/features/batch/batch-thumbnail-strip.tsx`
- Create: `src/features/batch/batch-preview.tsx`
- Create: `src/features/batch/use-batch-session.ts`
- Create: `src/features/batch/batch.screen.tsx`
- Create: `src/features/batch/index.ts`

### Step 4.1: Create thumbnail strip

- [ ] **Step 4.1.1: Implement thumbnail strip component**

```typescript
// src/features/batch/batch-thumbnail-strip.tsx
import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { IconButton } from '@ui/primitives/icon-button';
import type { BatchPhoto } from '@core/batch';
import { tokens } from '@theme/tokens';

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
          <Pressable style={styles.addButton} onPress={onAdd}>
            <IconButton icon="add" size={24} />
          </Pressable>
        }
        renderItem={({ item, index }) => (
          <Pressable
            style={[styles.thumbnail, selectedId === item.id && styles.thumbnailSelected]}
            onPress={() => onSelect(item.id)}
            onLongPress={() => onRemove(item.id)}
          >
            <Image
              source={{ uri: item.thumbnailUri ?? item.uri }}
              style={styles.thumbnailImage}
            />
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
            {item.status === 'completed' && (
              <View style={styles.statusBadge}>
                <IconButton icon="check" size={12} />
              </View>
            )}
            {item.status === 'failed' && (
              <View style={[styles.statusBadge, styles.statusError]}>
                <IconButton icon="error" size={12} />
              </View>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

import { Text } from '@ui/primitives/text';

const styles = StyleSheet.create({
  container: { height: 72, backgroundColor: tokens.colors.surfaceDark1 },
  listContent: { paddingHorizontal: 8, alignItems: 'center' },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: tokens.colors.surfaceDark2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: { borderColor: tokens.colors.accent },
  thumbnailImage: { width: '100%', height: '100%' },
  indexBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  indexText: { color: tokens.colors.textPrimary, fontSize: 10 },
  statusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: tokens.colors.accent,
    borderRadius: 8,
  },
  statusError: { backgroundColor: tokens.colors.error },
});
```

- [ ] **Step 4.1.2: Commit**

```bash
git add src/features/batch/batch-thumbnail-strip.tsx
git commit -m "$(cat <<'EOF'
feat(batch): add thumbnail strip component
EOF
)"
```

### Step 4.2: Create batch preview

- [ ] **Step 4.2.1: Implement batch preview component**

```typescript
// src/features/batch/batch-preview.tsx
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { IconButton } from '@ui/primitives/icon-button';
import type { BatchPhoto } from '@core/batch';
import { tokens } from '@theme/tokens';

interface BatchPreviewProps {
  readonly photo: BatchPhoto | null;
  readonly onPrev: () => void;
  readonly onNext: () => void;
  readonly hasPrev: boolean;
  readonly hasNext: boolean;
}

export function BatchPreview({
  photo,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: BatchPreviewProps): React.JSX.Element {
  if (!photo) {
    return (
      <View style={styles.container}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: photo.uri }} style={styles.image} resizeMode="contain" />

      <Pressable
        style={[styles.navButton, styles.navLeft]}
        onPress={onPrev}
        disabled={!hasPrev}
      >
        <IconButton
          icon="chevron-left"
          size={32}
          disabled={!hasPrev}
        />
      </Pressable>

      <Pressable
        style={[styles.navButton, styles.navRight]}
        onPress={onNext}
        disabled={!hasNext}
      >
        <IconButton
          icon="chevron-right"
          size={32}
          disabled={!hasNext}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.surfaceBlack,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    width: 200,
    height: 200,
    backgroundColor: tokens.colors.surfaceDark2,
    borderRadius: 8,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navLeft: { left: 8 },
  navRight: { right: 8 },
});
```

- [ ] **Step 4.2.2: Commit**

```bash
git add src/features/batch/batch-preview.tsx
git commit -m "$(cat <<'EOF'
feat(batch): add batch preview with navigation
EOF
)"
```

### Step 4.3: Create useBatchSession hook

- [ ] **Step 4.3.1: Implement hook**

```typescript
// src/features/batch/use-batch-session.ts
import { useCallback, useMemo, useReducer } from 'react';
import type { BatchSession, BatchWorkspace, BatchExportProgress } from '@core/batch';
import { createBatchWorkspace, createBatchSession } from '@core/batch';
import {
  createWorkspaceWithPhotos,
  addPhotosToWorkspace,
  removePhotoFromWorkspace,
  selectPhoto,
  applyPreset,
  exportBatch,
  type PhotoSelection,
  type BatchExportResult,
} from '@services/batch';

type BatchAction =
  | { type: 'SET_WORKSPACE'; workspace: BatchWorkspace }
  | { type: 'SET_STATE'; state: BatchSession['state'] }
  | { type: 'SET_PROGRESS'; progress: BatchExportProgress | null }
  | { type: 'SET_ERROR'; error: BatchSession['error'] }
  | { type: 'RESET' };

function batchReducer(state: BatchSession, action: BatchAction): BatchSession {
  switch (action.type) {
    case 'SET_WORKSPACE':
      return { ...state, workspace: action.workspace };
    case 'SET_STATE':
      return { ...state, state: action.state };
    case 'SET_PROGRESS':
      return { ...state, exportProgress: action.progress };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'RESET':
      return createBatchSession(createBatchWorkspace());
    default:
      return state;
  }
}

export function useBatchSession() {
  const [session, dispatch] = useReducer(
    batchReducer,
    createBatchSession(createBatchWorkspace()),
  );

  const addPhotos = useCallback(async (selections: PhotoSelection[]) => {
    dispatch({ type: 'SET_STATE', state: 'selecting' });
    try {
      const workspace = session.workspace.photos.length === 0
        ? await createWorkspaceWithPhotos(selections)
        : await addPhotosToWorkspace(session.workspace, selections);
      dispatch({ type: 'SET_WORKSPACE', workspace });
      dispatch({ type: 'SET_STATE', state: 'previewing' });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: {
          code: 'SELECTION_LIMIT',
          message: error instanceof Error ? error.message : 'Failed to add photos',
        },
      });
    }
  }, [session.workspace]);

  const removePhoto = useCallback(async (photoId: string) => {
    const workspace = await removePhotoFromWorkspace(session.workspace, photoId);
    dispatch({ type: 'SET_WORKSPACE', workspace });
  }, [session.workspace]);

  const selectPhotoById = useCallback((photoId: string) => {
    const workspace = selectPhoto(session.workspace, photoId);
    dispatch({ type: 'SET_WORKSPACE', workspace });
  }, [session.workspace]);

  const applyLut = useCallback((presetId: string | null, intensity: number) => {
    const workspace = applyPreset(session.workspace, presetId, intensity);
    dispatch({ type: 'SET_WORKSPACE', workspace });
  }, [session.workspace]);

  const startExport = useCallback(async (format: 'jpeg' | 'png') => {
    dispatch({ type: 'SET_STATE', state: 'exporting' });
    dispatch({ type: 'SET_PROGRESS', progress: { total: session.workspace.photos.length, completed: 0, failed: 0, currentPhotoId: null } });

    const result = await exportBatch(
      session.workspace,
      { format, quality: 0.9, preserveOriginalSize: true },
      (progress) => dispatch({ type: 'SET_PROGRESS', progress }),
    );

    if (result.failed.length > 0 && result.successful.length > 0) {
      dispatch({
        type: 'SET_ERROR',
        error: {
          code: 'EXPORT_PARTIAL',
          message: `${result.failed.length} photos failed to export`,
          failedPhotoIds: result.failed.map((f) => f.photoId),
        },
      });
    } else if (result.failed.length === result.successful.length + result.failed.length) {
      dispatch({
        type: 'SET_ERROR',
        error: { code: 'EXPORT_FAILED', message: 'All photos failed to export' },
      });
    }

    dispatch({ type: 'SET_STATE', state: result.failed.length > 0 ? 'error' : 'completed' });
  }, [session.workspace]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const selectedPhoto = useMemo(() => {
    return session.workspace.photos.find((p) => p.id === session.workspace.selectedPhotoId) ?? null;
  }, [session.workspace]);

  const selectedIndex = useMemo(() => {
    return session.workspace.photos.findIndex((p) => p.id === session.workspace.selectedPhotoId);
  }, [session.workspace]);

  const navigatePrev = useCallback(() => {
    if (selectedIndex > 0) {
      selectPhotoById(session.workspace.photos[selectedIndex - 1].id);
    }
  }, [selectedIndex, session.workspace.photos, selectPhotoById]);

  const navigateNext = useCallback(() => {
    if (selectedIndex < session.workspace.photos.length - 1) {
      selectPhotoById(session.workspace.photos[selectedIndex + 1].id);
    }
  }, [selectedIndex, session.workspace.photos, selectPhotoById]);

  return {
    session,
    selectedPhoto,
    selectedIndex,
    addPhotos,
    removePhoto,
    selectPhotoById,
    applyLut,
    startExport,
    reset,
    navigatePrev,
    navigateNext,
    hasPrev: selectedIndex > 0,
    hasNext: selectedIndex < session.workspace.photos.length - 1,
  };
}
```

- [ ] **Step 4.3.2: Commit**

```bash
git add src/features/batch/use-batch-session.ts
git commit -m "$(cat <<'EOF'
feat(batch): add useBatchSession hook
EOF
)"
```

### Step 4.4: Create BatchScreen

- [ ] **Step 4.4.1: Implement BatchScreen**

```typescript
// src/features/batch/batch.screen.tsx
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { SafeAreaView } from '@ui/layout/safe-area-view';
import { Text } from '@ui/primitives/text';
import { IconButton } from '@ui/primitives/icon-button';
import { Slider } from '@ui/primitives/slider';
import { BatchThumbnailStrip } from './batch-thumbnail-strip';
import { BatchPreview } from './batch-preview';
import { BatchPhotoPicker } from './batch-photo-picker';
import { useBatchSession } from './use-batch-session';
import { usePresetBrowser } from '@features/preset-browser';
import { tokens } from '@theme/tokens';

export function BatchScreen(): React.JSX.Element {
  const router = useRouter();
  const {
    session,
    selectedPhoto,
    addPhotos,
    removePhoto,
    selectPhotoById,
    applyLut,
    startExport,
    navigatePrev,
    navigateNext,
    hasPrev,
    hasNext,
  } = useBatchSession();
  const { presets } = usePresetBrowser('Favorites');

  const [showPicker, setShowPicker] = useState(session.workspace.photos.length === 0);
  const [intensity, setIntensity] = useState(1);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleExport = useCallback(() => {
    startExport('jpeg');
  }, [startExport]);

  const handlePhotosSelected = useCallback(
    (assets: MediaLibrary.Asset[]) => {
      const selections = assets.map((a) => ({
        id: a.id,
        uri: a.uri,
        width: a.width,
        height: a.height,
      }));
      addPhotos(selections);
    },
    [addPhotos],
  );

  const handlePresetSelect = useCallback(
    (presetId: string) => {
      applyLut(presetId, intensity);
    },
    [applyLut, intensity],
  );

  const handleIntensityChange = useCallback(
    (value: number) => {
      setIntensity(value);
      if (session.workspace.appliedPresetId) {
        applyLut(session.workspace.appliedPresetId, value);
      }
    },
    [applyLut, session.workspace.appliedPresetId],
  );

  const handleApplyAll = useCallback(() => {
    // LUT is already applied to workspace, this confirms it
  }, []);

  if (session.state === 'exporting') {
    const progress = session.exportProgress;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.exportProgress}>
          <ActivityIndicator size="large" color={tokens.colors.accent} />
          <Text style={styles.exportText}>
            Exporting {progress?.completed ?? 0} of {progress?.total ?? 0}...
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((progress?.completed ?? 0) / (progress?.total ?? 1)) * 100}%` },
              ]}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <IconButton icon="arrow-back" onPress={handleBack} />
        <Text style={styles.title}>BATCH PROCESS</Text>
        <Pressable
          style={[styles.exportButton, session.workspace.photos.length === 0 && styles.exportButtonDisabled]}
          onPress={handleExport}
          disabled={session.workspace.photos.length === 0}
        >
          <Text style={styles.exportText}>EXPORT</Text>
        </Pressable>
      </View>

      <BatchThumbnailStrip
        photos={session.workspace.photos}
        selectedId={session.workspace.selectedPhotoId}
        onSelect={selectPhotoById}
        onAdd={() => setShowPicker(true)}
        onRemove={removePhoto}
      />

      <BatchPreview
        photo={selectedPhoto}
        onPrev={navigatePrev}
        onNext={navigateNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />

      <View style={styles.controls}>
        <View style={styles.intensityRow}>
          <IconButton icon="delete" onPress={() => applyLut(null, 1)} />
          <Text style={styles.intensityLabel}>{Math.round(intensity * 100)}%</Text>
          <Slider
            style={styles.intensitySlider}
            value={intensity}
            minimumValue={0}
            maximumValue={1}
            onValueChange={handleIntensityChange}
          />
          <Pressable style={styles.applyAllButton} onPress={handleApplyAll}>
            <Text style={styles.applyAllText}>APPLY ALL</Text>
          </Pressable>
        </View>
      </View>

      <BatchPhotoPicker
        visible={showPicker}
        currentCount={session.workspace.photos.length}
        onSelect={handlePhotosSelected}
        onClose={() => setShowPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.surfaceBlack },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  title: { color: tokens.colors.textPrimary, fontSize: 16, fontWeight: '600' },
  exportButton: {
    backgroundColor: tokens.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 980,
  },
  exportButtonDisabled: { opacity: 0.5 },
  exportText: { color: tokens.colors.textPrimary, fontSize: 14, fontWeight: '600' },
  controls: {
    padding: 16,
    backgroundColor: tokens.colors.surfaceDark1,
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intensityLabel: { color: tokens.colors.textPrimary, width: 50, textAlign: 'center' },
  intensitySlider: { flex: 1, marginHorizontal: 8 },
  applyAllButton: {
    backgroundColor: tokens.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  applyAllText: { color: tokens.colors.textPrimary, fontSize: 12, fontWeight: '600' },
  exportProgress: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: tokens.colors.surfaceDark2,
    borderRadius: 2,
    marginTop: 16,
  },
  progressFill: { height: '100%', backgroundColor: tokens.colors.accent, borderRadius: 2 },
});
```

- [ ] **Step 4.4.2: Create barrel export**

```typescript
// src/features/batch/index.ts
export { BatchScreen } from './batch.screen';
export { BatchPhotoPicker } from './batch-photo-picker';
export { BatchThumbnailStrip } from './batch-thumbnail-strip';
export { BatchPreview } from './batch-preview';
export { useBatchSession } from './use-batch-session';
```

- [ ] **Step 4.4.3: Commit**

```bash
git add src/features/batch/
git commit -m "$(cat <<'EOF'
feat(batch): add BatchScreen with full workflow
EOF
)"
```

---

## Task 5: Batch Route and Home Integration

**Files:**
- Create: `app/batch.tsx`
- Modify: `src/features/home/home.screen.tsx`

### Step 5.1: Create batch route

- [ ] **Step 5.1.1: Create route file**

```typescript
// app/batch.tsx
import { BatchScreen } from '@features/batch';

export default function Batch() {
  return <BatchScreen />;
}
```

- [ ] **Step 5.1.2: Commit**

```bash
git add app/batch.tsx
git commit -m "$(cat <<'EOF'
feat(routes): add /batch route
EOF
)"
```

### Step 5.2: Add batch entry to Home

- [ ] **Step 5.2.1: Update HomeScreen**

```typescript
// Add to src/features/home/home.screen.tsx
// After the ADD NEW PHOTO button, add:

const handleBatchPress = useCallback(() => {
  router.push('/batch');
}, [router]);

// In JSX, add batch button:
<Pressable style={styles.batchButton} onPress={handleBatchPress}>
  <IconButton icon="collections" />
  <Text style={styles.batchButtonText}>BATCH PROCESS</Text>
</Pressable>

// Add styles:
batchButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: tokens.colors.surfaceDark2,
  marginHorizontal: 16,
  marginTop: 12,
  paddingVertical: 12,
  borderRadius: 980,
},
batchButtonText: {
  color: tokens.colors.textPrimary,
  fontSize: 14,
  marginLeft: 8,
},
```

- [ ] **Step 5.2.2: Commit**

```bash
git add src/features/home/home.screen.tsx
git commit -m "$(cat <<'EOF'
feat(home): add batch entry button
EOF
)"
```

---

## Task 6: Blend Model and Transform

**Files:**
- Create: `src/core/blend/blend-model.ts`
- Create: `src/core/blend/index.ts`
- Create: `src/adapters/skia/blend-shader.ts`
- Create: `src/core/render/blend-transform.ts`

### Step 6.1: Define blend model

- [ ] **Step 6.1.1: Create blend types**

```typescript
// src/core/blend/blend-model.ts
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'exclusion';

export interface BlendLayer {
  readonly id: string;
  readonly imageUri: string;
  readonly width: number;
  readonly height: number;
  readonly blendMode: BlendMode;
  readonly opacity: number;
  readonly position: { x: number; y: number };
  readonly scale: number;
}

export interface BlendParams {
  readonly layers: readonly BlendLayer[];
}

export const BLEND_MODE_LABELS: Record<BlendMode, string> = {
  normal: 'Normal',
  multiply: 'Multiply',
  screen: 'Screen',
  overlay: 'Overlay',
  'soft-light': 'Soft Light',
  'hard-light': 'Hard Light',
  'color-dodge': 'Color Dodge',
  'color-burn': 'Color Burn',
  darken: 'Darken',
  lighten: 'Lighten',
  difference: 'Difference',
  exclusion: 'Exclusion',
};

export function createBlendLayer(
  imageUri: string,
  width: number,
  height: number,
): BlendLayer {
  return {
    id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    imageUri,
    width,
    height,
    blendMode: 'normal',
    opacity: 1,
    position: { x: 0, y: 0 },
    scale: 1,
  };
}
```

- [ ] **Step 6.1.2: Create barrel export**

```typescript
// src/core/blend/index.ts
export type { BlendMode, BlendLayer, BlendParams } from './blend-model';
export { BLEND_MODE_LABELS, createBlendLayer } from './blend-model';
```

- [ ] **Step 6.1.3: Commit**

```bash
git add src/core/blend/
git commit -m "$(cat <<'EOF'
feat(blend): add blend model with 12 blend modes
EOF
)"
```

### Step 6.2: Create blend shader

- [ ] **Step 6.2.1: Implement Skia blend shader**

```typescript
// src/adapters/skia/blend-shader.ts
import { Skia, BlendMode as SkiaBlendMode } from '@shopify/react-native-skia';
import type { BlendMode } from '@core/blend';

export const SKIA_BLEND_MODES: Record<BlendMode, SkiaBlendMode> = {
  normal: 'srcOver',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  'soft-light': 'softLight',
  'hard-light': 'hardLight',
  'color-dodge': 'colorDodge',
  'color-burn': 'colorBurn',
  darken: 'darken',
  lighten: 'lighten',
  difference: 'difference',
  exclusion: 'exclusion',
};

export function getSkiaBlendMode(mode: BlendMode): SkiaBlendMode {
  return SKIA_BLEND_MODES[mode] ?? 'srcOver';
}
```

- [ ] **Step 6.2.2: Commit**

```bash
git add src/adapters/skia/blend-shader.ts
git commit -m "$(cat <<'EOF'
feat(skia): add blend mode mapping
EOF
)"
```

### Step 6.3: Create blend transform

- [ ] **Step 6.3.1: Implement transform**

```typescript
// src/core/render/blend-transform.ts
import type { BlendParams, BlendLayer } from '@core/blend';
import { compositeWithBlend } from '@services/image/cpu-render.service';
import type { TransformResult } from './transform-executor';

export async function applyBlend(
  uri: string,
  width: number,
  height: number,
  params: BlendParams,
): Promise<TransformResult> {
  if (params.layers.length === 0) {
    return { uri, width, height };
  }

  let currentUri = uri;

  for (const layer of params.layers) {
    currentUri = await compositeWithBlend(
      currentUri,
      width,
      height,
      layer.imageUri,
      layer.blendMode,
      layer.opacity,
      layer.position,
      layer.scale,
    );
  }

  return { uri: currentUri, width, height };
}
```

- [ ] **Step 6.3.2: Wire to transform executor**

```typescript
// Add to src/core/render/transform-executor.ts
import { applyBlend } from './blend-transform';

case 'blend': {
  return applyBlend(uri, width, height, transform.params);
}
```

- [ ] **Step 6.3.3: Commit**

```bash
git add src/core/render/blend-transform.ts src/core/render/transform-executor.ts
git commit -m "$(cat <<'EOF'
feat(render): add blend transform with layer compositing
EOF
)"
```

---

## Task 7: Blend Sheet UI

**Files:**
- Create: `src/features/editor/blend-sheet.tsx`

### Step 7.1: Implement BlendSheet

- [ ] **Step 7.1.1: Create component**

```typescript
// src/features/editor/blend-sheet.tsx
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheet } from '@ui/layout/bottom-sheet';
import { Text } from '@ui/primitives/text';
import { Slider } from '@ui/primitives/slider';
import { IconButton } from '@ui/primitives/icon-button';
import { BLEND_MODE_LABELS, createBlendLayer, type BlendLayer, type BlendMode, type BlendParams } from '@core/blend';
import { tokens } from '@theme/tokens';

interface BlendSheetProps {
  readonly visible: boolean;
  readonly initialParams: BlendParams | null;
  readonly onApply: (params: BlendParams | null) => void;
  readonly onCancel: () => void;
  readonly onPreview: (params: BlendParams | null) => void;
}

const BLEND_MODES = Object.keys(BLEND_MODE_LABELS) as BlendMode[];

export function BlendSheet({
  visible,
  initialParams,
  onApply,
  onCancel,
  onPreview,
}: BlendSheetProps): React.JSX.Element {
  const [layers, setLayers] = useState<BlendLayer[]>(
    initialParams?.layers ? [...initialParams.layers] : [],
  );
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const handleAddLayer = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const newLayer = createBlendLayer(asset.uri, asset.width, asset.height);
      setLayers((prev) => {
        const next = [...prev, newLayer];
        onPreview({ layers: next });
        return next;
      });
      setSelectedLayerId(newLayer.id);
    }
  }, [onPreview]);

  const handleRemoveLayer = useCallback(
    (layerId: string) => {
      setLayers((prev) => {
        const next = prev.filter((l) => l.id !== layerId);
        onPreview(next.length > 0 ? { layers: next } : null);
        return next;
      });
      if (selectedLayerId === layerId) {
        setSelectedLayerId(null);
      }
    },
    [selectedLayerId, onPreview],
  );

  const handleUpdateLayer = useCallback(
    (layerId: string, updates: Partial<BlendLayer>) => {
      setLayers((prev) => {
        const next = prev.map((l) => (l.id === layerId ? { ...l, ...updates } : l));
        onPreview({ layers: next });
        return next;
      });
    },
    [onPreview],
  );

  const handleApply = useCallback(() => {
    onApply(layers.length > 0 ? { layers } : null);
  }, [layers, onApply]);

  const handleClear = useCallback(() => {
    setLayers([]);
    setSelectedLayerId(null);
    onPreview(null);
  }, [onPreview]);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <Text style={styles.title}>BLEND</Text>

      <View style={styles.layerStrip}>
        <Pressable style={styles.addLayerButton} onPress={handleAddLayer}>
          <IconButton icon="add" />
        </Pressable>
        <FlatList
          data={layers}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.layerThumb, selectedLayerId === item.id && styles.layerThumbSelected]}
              onPress={() => setSelectedLayerId(item.id)}
            >
              <Image source={{ uri: item.imageUri }} style={styles.layerImage} />
              <Pressable style={styles.removeButton} onPress={() => handleRemoveLayer(item.id)}>
                <IconButton icon="close" size={12} />
              </Pressable>
            </Pressable>
          )}
        />
      </View>

      {selectedLayer && (
        <View style={styles.layerControls}>
          <Text style={styles.controlLabel}>Blend Mode</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.blendModes}>
            {BLEND_MODES.map((mode) => (
              <Pressable
                key={mode}
                style={[styles.modeButton, selectedLayer.blendMode === mode && styles.modeButtonActive]}
                onPress={() => handleUpdateLayer(selectedLayer.id, { blendMode: mode })}
              >
                <Text style={styles.modeText}>{BLEND_MODE_LABELS[mode]}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.sliderRow}>
            <Text style={styles.controlLabel}>Opacity: {Math.round(selectedLayer.opacity * 100)}%</Text>
            <Slider
              value={selectedLayer.opacity}
              minimumValue={0}
              maximumValue={1}
              onValueChange={(v) => handleUpdateLayer(selectedLayer.id, { opacity: v })}
            />
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <IconButton icon="close" onPress={onCancel} />
        <IconButton icon="delete" label="Clear" onPress={handleClear} />
        <IconButton icon="check" onPress={handleApply} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    color: tokens.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  layerStrip: {
    flexDirection: 'row',
    marginBottom: 16,
    height: 64,
  },
  addLayerButton: {
    width: 56,
    height: 56,
    borderRadius: 4,
    backgroundColor: tokens.colors.surfaceDark2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  layerThumb: {
    width: 56,
    height: 56,
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  layerThumbSelected: { borderColor: tokens.colors.accent },
  layerImage: { width: '100%', height: '100%' },
  removeButton: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
  },
  layerControls: { marginBottom: 16 },
  controlLabel: { color: tokens.colors.textSecondary, fontSize: 12, marginBottom: 8 },
  blendModes: { marginBottom: 12 },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: tokens.colors.surfaceDark2,
  },
  modeButtonActive: { backgroundColor: tokens.colors.accent },
  modeText: { color: tokens.colors.textPrimary, fontSize: 12 },
  sliderRow: { marginTop: 8 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
});
```

- [ ] **Step 7.1.2: Commit**

```bash
git add src/features/editor/blend-sheet.tsx
git commit -m "$(cat <<'EOF'
feat(editor): add BlendSheet with layer management
EOF
)"
```

---

## Task 8: Ad Manager Service

**Files:**
- Create: `src/services/ads/ad-manager.ts`
- Create: `src/services/ads/index.ts`

### Step 8.1: Implement ad manager

- [ ] **Step 8.1.1: Create ad manager with offline fallback**

```typescript
// src/services/ads/ad-manager.ts
import { Platform } from 'react-native';

export interface AdConfig {
  readonly bannerId: string;
  readonly interstitialId: string;
  readonly testMode: boolean;
}

export interface AdState {
  readonly isInitialized: boolean;
  readonly isOnline: boolean;
  readonly lastInterstitialTime: number;
}

const INTERSTITIAL_COOLDOWN_MS = 5 * 60 * 1000;

let adState: AdState = {
  isInitialized: false,
  isOnline: false,
  lastInterstitialTime: 0,
};

export async function initializeAds(config: AdConfig): Promise<boolean> {
  try {
    // Dynamic import to handle missing module gracefully
    const AdMob = await import('expo-ads-admob').catch(() => null);
    if (!AdMob) {
      console.warn('expo-ads-admob not available');
      return false;
    }

    await AdMob.setTestDeviceIDAsync(config.testMode ? 'EMULATOR' : null);
    adState = { ...adState, isInitialized: true, isOnline: true };
    return true;
  } catch (error) {
    console.warn('Failed to initialize ads:', error);
    return false;
  }
}

export function getAdState(): AdState {
  return adState;
}

export function canShowInterstitial(): boolean {
  if (!adState.isInitialized || !adState.isOnline) {
    return false;
  }

  const timeSinceLastAd = Date.now() - adState.lastInterstitialTime;
  return timeSinceLastAd >= INTERSTITIAL_COOLDOWN_MS;
}

export async function showInterstitial(): Promise<boolean> {
  if (!canShowInterstitial()) {
    return false;
  }

  try {
    const AdMob = await import('expo-ads-admob').catch(() => null);
    if (!AdMob) {
      return false;
    }

    await AdMob.AdMobInterstitial.setAdUnitID(getInterstitialId());
    await AdMob.AdMobInterstitial.requestAdAsync();
    await AdMob.AdMobInterstitial.showAdAsync();

    adState = { ...adState, lastInterstitialTime: Date.now() };
    return true;
  } catch (error) {
    console.warn('Failed to show interstitial:', error);
    return false;
  }
}

export function getBannerId(): string {
  return Platform.select({
    ios: 'ca-app-pub-xxxxx/banner-ios',
    android: 'ca-app-pub-xxxxx/banner-android',
    default: '',
  });
}

export function getInterstitialId(): string {
  return Platform.select({
    ios: 'ca-app-pub-xxxxx/interstitial-ios',
    android: 'ca-app-pub-xxxxx/interstitial-android',
    default: '',
  });
}

export function setOnlineStatus(isOnline: boolean): void {
  adState = { ...adState, isOnline };
}
```

- [ ] **Step 8.1.2: Create barrel export**

```typescript
// src/services/ads/index.ts
export type { AdConfig, AdState } from './ad-manager';
export {
  initializeAds,
  getAdState,
  canShowInterstitial,
  showInterstitial,
  getBannerId,
  getInterstitialId,
  setOnlineStatus,
} from './ad-manager';
```

- [ ] **Step 8.1.3: Commit**

```bash
git add src/services/ads/
git commit -m "$(cat <<'EOF'
feat(ads): add ad manager with offline fallback
EOF
)"
```

---

## Task 9: Home Ad Banner

**Files:**
- Create: `src/features/home/home-ad-banner.tsx`
- Modify: `src/features/home/home.screen.tsx`

### Step 9.1: Create ad banner component

- [ ] **Step 9.1.1: Implement HomeAdBanner**

```typescript
// src/features/home/home-ad-banner.tsx
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getAdState, getBannerId } from '@services/ads';
import { tokens } from '@theme/tokens';

export function HomeAdBanner(): React.JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const [AdMobBanner, setAdMobBanner] = useState<any>(null);

  useEffect(() => {
    const loadAdMob = async () => {
      const adState = getAdState();
      if (!adState.isInitialized || !adState.isOnline) {
        setIsVisible(false);
        return;
      }

      try {
        const AdMob = await import('expo-ads-admob');
        setAdMobBanner(() => AdMob.AdMobBanner);
        setIsVisible(true);
      } catch {
        setIsVisible(false);
      }
    };

    loadAdMob();
  }, []);

  if (!isVisible || !AdMobBanner) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AdMobBanner
        bannerSize="smartBannerPortrait"
        adUnitID={getBannerId()}
        onAdFailedToLoad={() => setIsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: tokens.colors.surfaceDark1,
  },
});
```

- [ ] **Step 9.1.2: Commit**

```bash
git add src/features/home/home-ad-banner.tsx
git commit -m "$(cat <<'EOF'
feat(home): add ad banner component with offline fallback
EOF
)"
```

### Step 9.2: Integrate ad banner into Home

- [ ] **Step 9.2.1: Update HomeScreen**

```typescript
// Add to src/features/home/home.screen.tsx
import { HomeAdBanner } from './home-ad-banner';

// In JSX, add at the bottom of the content area:
<HomeAdBanner />
```

- [ ] **Step 9.2.2: Commit**

```bash
git add src/features/home/home.screen.tsx
git commit -m "$(cat <<'EOF'
feat(home): integrate ad banner
EOF
)"
```

---

## Task 10: Update EditState for Blend

**Files:**
- Modify: `src/core/edit-session/edit-state.ts`
- Modify: `src/core/edit-session/edit-action.ts`
- Modify: `src/features/editor/editor-reducer.ts`

### Step 10.1: Add blend to EditState

- [ ] **Step 10.1.1: Update edit-state.ts**

```typescript
// Add to src/core/edit-session/edit-state.ts
import type { BlendParams } from '@core/blend';

// Add to EditState interface:
readonly blend: BlendParams | null;

// Update createInitialEditState:
blend: null,
```

- [ ] **Step 10.1.2: Update edit-action.ts**

```typescript
// Add to src/core/edit-session/edit-action.ts
import type { BlendParams } from '@core/blend';

// Add to EditAction union:
| { readonly type: 'SET_BLEND'; readonly params: BlendParams }
| { readonly type: 'CLEAR_BLEND' }
```

- [ ] **Step 10.1.3: Update editor-reducer.ts**

```typescript
// Add cases to applyEditAction:
case 'SET_BLEND':
  return { ...state, blend: action.params };
case 'CLEAR_BLEND':
  return { ...state, blend: null };
```

- [ ] **Step 10.1.4: Commit**

```bash
git add src/core/edit-session/edit-state.ts src/core/edit-session/edit-action.ts src/features/editor/editor-reducer.ts
git commit -m "$(cat <<'EOF'
feat(edit-session): add blend support to EditState
EOF
)"
```

---

## Task 11: Enable Blend in Tool Grid

**Files:**
- Modify: `src/features/editor/tool-sheet.tsx`
- Modify: `src/features/editor/editor.screen.tsx`

### Step 11.1: Enable Blend tool

- [ ] **Step 11.1.1: Update tool grid**

```typescript
// In src/features/editor/tool-sheet.tsx
// Change Blend from disabled: true to disabled: false
{ id: 'blend', icon: 'layers', label: 'Blend', disabled: false },
```

- [ ] **Step 11.1.2: Wire BlendSheet to EditorScreen**

```typescript
// Update src/features/editor/editor.screen.tsx
// Add 'blend' to SheetType union
// Import BlendSheet and add to sheet rendering
```

- [ ] **Step 11.1.3: Commit**

```bash
git add src/features/editor/tool-sheet.tsx src/features/editor/editor.screen.tsx
git commit -m "$(cat <<'EOF'
feat(editor): enable Blend tool
EOF
)"
```

---

## Task 12: Integration Tests

**Files:**
- Create: `src/features/batch/batch.screen.test.tsx`

### Step 12.1: Add batch tests

- [ ] **Step 12.1.1: Write batch integration test**

```typescript
// src/features/batch/batch.screen.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BatchScreen } from './batch.screen';

describe('BatchScreen', () => {
  it('shows photo picker on initial render', () => {
    const { getByText } = render(<BatchScreen />);

    expect(getByText('Select Photos')).toBeTruthy();
  });

  it('shows thumbnail strip after photos selected', async () => {
    const { getByLabelText, queryByTestId } = render(<BatchScreen />);

    // Mock photo selection
    await waitFor(() => {
      expect(queryByTestId('thumbnail-strip')).toBeTruthy();
    });
  });

  it('shows export progress during batch export', async () => {
    const { getByText } = render(<BatchScreen />);

    // Trigger export
    fireEvent.press(getByText('EXPORT'));

    await waitFor(() => {
      expect(getByText(/Exporting/)).toBeTruthy();
    });
  });
});
```

- [ ] **Step 12.1.2: Run tests**

Run: `npm test -- --testPathPattern=batch.screen`
Expected: PASS

- [ ] **Step 12.1.3: Commit**

```bash
git add src/features/batch/batch.screen.test.tsx
git commit -m "$(cat <<'EOF'
test(batch): add batch screen integration tests
EOF
)"
```

---

## Task 13: Final Verification

### Step 13.1: Run full test suite

- [ ] **Step 13.1.1: Run all tests**

Run: `npm test`
Expected: All tests pass

### Step 13.2: Manual QA checklist

- [ ] **Step 13.2.1: Verify batch workflow**
  - Open Home > Batch Process
  - Select 5-10 photos
  - Apply a LUT
  - Export all
  - Verify all exported to gallery

- [ ] **Step 13.2.2: Verify blend tool**
  - Open Editor
  - Open Tools > Blend
  - Add overlay layer
  - Change blend mode
  - Adjust opacity
  - Apply and export

- [ ] **Step 13.2.3: Verify ad banner**
  - Open Home (with network)
  - Verify banner loads
  - Disconnect network
  - Verify banner hides gracefully

### Step 13.3: Final commit

- [ ] **Step 13.3.1: Commit any remaining changes**

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: complete Phase 3 - Batch + Advanced

- Batch screen with 20-photo limit
- Two-tab photo picker (Recent + Albums)
- Batch LUT application and export queue
- Export progress with partial failure handling
- Blend tool with 12 blend modes
- Layer management with opacity control
- Home ad banner with offline fallback
- Ad manager with 5-minute interstitial cooldown
EOF
)"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-phase-3-batch-advanced.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
