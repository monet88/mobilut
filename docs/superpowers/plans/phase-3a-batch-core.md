# Phase 3A: Batch Core

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add batch processing core models, workspace service, and thumbnail cache.

**Architecture:** BatchWorkspace manages selected photos, BatchItem tracks per-photo edit state, ThumbnailCache provides fast previews.

**Tech Stack:** TypeScript, expo-file-system, expo-media-library

**Estimated context:** ~30K tokens

**Prerequisites:** Phase 2 complete

---

## File Structure

### New Files
| Path | Responsibility |
|------|----------------|
| `src/core/batch/batch-model.ts` | BatchItem, BatchWorkspace types |
| `src/core/batch/batch-workspace.ts` | Workspace state management |
| `src/services/batch/batch-workspace.service.ts` | Workspace service orchestration |
| `src/services/batch/thumbnail-cache.service.ts` | Thumbnail generation and caching |

---

## Task 1: Batch Model

### Step 1.1: Create batch types

- [ ] **Step 1.1.1: Create model file**

```typescript
// src/core/batch/batch-model.ts
import type { EditState } from '@core/edit-session/edit-state';

export interface BatchItem {
  readonly id: string;
  readonly assetId: string;
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  readonly filename: string;
  readonly editState: EditState | null;
  readonly status: BatchItemStatus;
  readonly exportedUri: string | null;
  readonly error: string | null;
}

export type BatchItemStatus = 
  | 'pending'
  | 'editing'
  | 'ready'
  | 'exporting'
  | 'exported'
  | 'error';

export interface BatchWorkspace {
  readonly id: string;
  readonly items: readonly BatchItem[];
  readonly activeItemId: string | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export const MAX_BATCH_SIZE = 20;

export function createBatchItem(
  assetId: string,
  uri: string,
  width: number,
  height: number,
  filename: string,
): BatchItem {
  return {
    id: `batch-item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    assetId,
    uri,
    width,
    height,
    filename,
    editState: null,
    status: 'pending',
    exportedUri: null,
    error: null,
  };
}

export function createBatchWorkspace(items: BatchItem[]): BatchWorkspace {
  const now = Date.now();
  return {
    id: `batch-${now}-${Math.random().toString(36).slice(2, 9)}`,
    items,
    activeItemId: items[0]?.id ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export function getBatchProgress(workspace: BatchWorkspace): {
  total: number;
  exported: number;
  errors: number;
  percentage: number;
} {
  const total = workspace.items.length;
  const exported = workspace.items.filter(i => i.status === 'exported').length;
  const errors = workspace.items.filter(i => i.status === 'error').length;
  const percentage = total > 0 ? Math.round((exported / total) * 100) : 0;
  return { total, exported, errors, percentage };
}
```

- [ ] **Step 1.1.2: Add test**

```typescript
// src/core/batch/batch-model.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  createBatchItem,
  createBatchWorkspace,
  getBatchProgress,
  MAX_BATCH_SIZE,
} from './batch-model';

describe('batch-model', () => {
  it('creates batch item with pending status', () => {
    const item = createBatchItem('asset-1', 'file:///photo.jpg', 1920, 1080, 'photo.jpg');
    
    expect(item.assetId).toBe('asset-1');
    expect(item.status).toBe('pending');
    expect(item.editState).toBeNull();
    expect(item.exportedUri).toBeNull();
  });

  it('creates workspace with first item active', () => {
    const items = [
      createBatchItem('a1', 'file:///1.jpg', 100, 100, '1.jpg'),
      createBatchItem('a2', 'file:///2.jpg', 100, 100, '2.jpg'),
    ];
    const workspace = createBatchWorkspace(items);

    expect(workspace.items.length).toBe(2);
    expect(workspace.activeItemId).toBe(items[0].id);
  });

  it('calculates batch progress correctly', () => {
    const items = [
      { ...createBatchItem('a1', '', 0, 0, ''), status: 'exported' as const },
      { ...createBatchItem('a2', '', 0, 0, ''), status: 'exported' as const },
      { ...createBatchItem('a3', '', 0, 0, ''), status: 'error' as const },
      { ...createBatchItem('a4', '', 0, 0, ''), status: 'pending' as const },
    ];
    const workspace = createBatchWorkspace(items);

    const progress = getBatchProgress(workspace);
    expect(progress.total).toBe(4);
    expect(progress.exported).toBe(2);
    expect(progress.errors).toBe(1);
    expect(progress.percentage).toBe(50);
  });

  it('enforces max batch size constant', () => {
    expect(MAX_BATCH_SIZE).toBe(20);
  });
});
```

- [ ] **Step 1.1.3: Run test**

```bash
npm test -- --testPathPattern=batch-model
```
Expected: PASS

- [ ] **Step 1.1.4: Commit**

```bash
git add src/core/batch/
git commit -m "feat(batch): add BatchItem and BatchWorkspace models"
```

---

## Task 2: Batch Workspace State

### Step 2.1: Create workspace state manager

- [ ] **Step 2.1.1: Implement workspace state**

```typescript
// src/core/batch/batch-workspace.ts
import type { EditState } from '@core/edit-session/edit-state';
import type { BatchItem, BatchItemStatus, BatchWorkspace } from './batch-model';

export type BatchWorkspaceAction =
  | { readonly type: 'SET_ACTIVE_ITEM'; readonly itemId: string }
  | { readonly type: 'UPDATE_ITEM_STATUS'; readonly itemId: string; readonly status: BatchItemStatus }
  | { readonly type: 'UPDATE_ITEM_EDIT_STATE'; readonly itemId: string; readonly editState: EditState }
  | { readonly type: 'SET_ITEM_EXPORTED'; readonly itemId: string; readonly exportedUri: string }
  | { readonly type: 'SET_ITEM_ERROR'; readonly itemId: string; readonly error: string }
  | { readonly type: 'APPLY_EDIT_TO_ALL'; readonly editState: EditState }
  | { readonly type: 'REMOVE_ITEM'; readonly itemId: string };

export function batchWorkspaceReducer(
  state: BatchWorkspace,
  action: BatchWorkspaceAction,
): BatchWorkspace {
  const now = Date.now();

  switch (action.type) {
    case 'SET_ACTIVE_ITEM':
      return { ...state, activeItemId: action.itemId, updatedAt: now };

    case 'UPDATE_ITEM_STATUS':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.itemId ? { ...item, status: action.status } : item
        ),
        updatedAt: now,
      };

    case 'UPDATE_ITEM_EDIT_STATE':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.itemId 
            ? { ...item, editState: action.editState, status: 'ready' as const } 
            : item
        ),
        updatedAt: now,
      };

    case 'SET_ITEM_EXPORTED':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.itemId 
            ? { ...item, exportedUri: action.exportedUri, status: 'exported' as const } 
            : item
        ),
        updatedAt: now,
      };

    case 'SET_ITEM_ERROR':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.itemId 
            ? { ...item, error: action.error, status: 'error' as const } 
            : item
        ),
        updatedAt: now,
      };

    case 'APPLY_EDIT_TO_ALL':
      return {
        ...state,
        items: state.items.map(item => ({
          ...item,
          editState: action.editState,
          status: 'ready' as const,
        })),
        updatedAt: now,
      };

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.itemId);
      const needNewActive = state.activeItemId === action.itemId;
      return {
        ...state,
        items: newItems,
        activeItemId: needNewActive ? (newItems[0]?.id ?? null) : state.activeItemId,
        updatedAt: now,
      };
    }

    default:
      return state;
  }
}

export function getActiveItem(workspace: BatchWorkspace): BatchItem | null {
  if (!workspace.activeItemId) return null;
  return workspace.items.find(item => item.id === workspace.activeItemId) ?? null;
}

export function getNextPendingItem(workspace: BatchWorkspace): BatchItem | null {
  return workspace.items.find(item => item.status === 'pending') ?? null;
}

export function getAllReadyItems(workspace: BatchWorkspace): BatchItem[] {
  return workspace.items.filter(item => item.status === 'ready');
}
```

- [ ] **Step 2.1.2: Add test**

```typescript
// src/core/batch/batch-workspace.test.ts
import { describe, it, expect } from '@jest/globals';
import { createBatchItem, createBatchWorkspace } from './batch-model';
import {
  batchWorkspaceReducer,
  getActiveItem,
  getNextPendingItem,
  getAllReadyItems,
} from './batch-workspace';
import { createInitialEditState } from '@core/edit-session/edit-state';

describe('batch-workspace', () => {
  const createTestWorkspace = () => {
    const items = [
      createBatchItem('a1', 'file:///1.jpg', 100, 100, '1.jpg'),
      createBatchItem('a2', 'file:///2.jpg', 100, 100, '2.jpg'),
    ];
    return createBatchWorkspace(items);
  };

  it('sets active item', () => {
    const workspace = createTestWorkspace();
    const itemId = workspace.items[1].id;

    const result = batchWorkspaceReducer(workspace, {
      type: 'SET_ACTIVE_ITEM',
      itemId,
    });

    expect(result.activeItemId).toBe(itemId);
  });

  it('updates item edit state and sets status to ready', () => {
    const workspace = createTestWorkspace();
    const itemId = workspace.items[0].id;
    const editState = createInitialEditState('file:///1.jpg', 100, 100);

    const result = batchWorkspaceReducer(workspace, {
      type: 'UPDATE_ITEM_EDIT_STATE',
      itemId,
      editState,
    });

    const updatedItem = result.items.find(i => i.id === itemId);
    expect(updatedItem?.editState).toBe(editState);
    expect(updatedItem?.status).toBe('ready');
  });

  it('applies edit to all items', () => {
    const workspace = createTestWorkspace();
    const editState = createInitialEditState('file:///1.jpg', 100, 100);

    const result = batchWorkspaceReducer(workspace, {
      type: 'APPLY_EDIT_TO_ALL',
      editState,
    });

    expect(result.items.every(i => i.editState === editState)).toBe(true);
    expect(result.items.every(i => i.status === 'ready')).toBe(true);
  });

  it('removes item and updates active if needed', () => {
    const workspace = createTestWorkspace();
    const firstItemId = workspace.items[0].id;
    const secondItemId = workspace.items[1].id;

    const result = batchWorkspaceReducer(workspace, {
      type: 'REMOVE_ITEM',
      itemId: firstItemId,
    });

    expect(result.items.length).toBe(1);
    expect(result.activeItemId).toBe(secondItemId);
  });

  it('getActiveItem returns current active', () => {
    const workspace = createTestWorkspace();
    const active = getActiveItem(workspace);
    expect(active?.id).toBe(workspace.items[0].id);
  });

  it('getNextPendingItem returns first pending', () => {
    const workspace = createTestWorkspace();
    const pending = getNextPendingItem(workspace);
    expect(pending?.status).toBe('pending');
  });
});
```

- [ ] **Step 2.1.3: Run test**

```bash
npm test -- --testPathPattern=batch-workspace
```
Expected: PASS

- [ ] **Step 2.1.4: Commit**

```bash
git add src/core/batch/
git commit -m "feat(batch): add BatchWorkspace reducer and selectors"
```

---

## Task 3: Thumbnail Cache Service

### Step 3.1: Create thumbnail cache

- [ ] **Step 3.1.1: Implement service**

```typescript
// src/services/batch/thumbnail-cache.service.ts
import * as FileSystem from 'expo-file-system';
import { Image } from 'react-native';

const THUMBNAIL_SIZE = 200;
const CACHE_DIR = `${FileSystem.cacheDirectory}thumbnails/`;

interface ThumbnailEntry {
  uri: string;
  timestamp: number;
}

const memoryCache = new Map<string, ThumbnailEntry>();

export async function ensureCacheDirectory(): Promise<void> {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

export async function getThumbnail(
  assetId: string,
  sourceUri: string,
): Promise<string> {
  const cached = memoryCache.get(assetId);
  if (cached) {
    return cached.uri;
  }

  const diskPath = `${CACHE_DIR}${assetId}.jpg`;
  const diskInfo = await FileSystem.getInfoAsync(diskPath);
  
  if (diskInfo.exists) {
    memoryCache.set(assetId, { uri: diskPath, timestamp: Date.now() });
    return diskPath;
  }

  const thumbnailUri = await generateThumbnail(sourceUri, diskPath);
  memoryCache.set(assetId, { uri: thumbnailUri, timestamp: Date.now() });
  return thumbnailUri;
}

async function generateThumbnail(
  sourceUri: string,
  destPath: string,
): Promise<string> {
  const { width, height } = await getImageSize(sourceUri);
  const scale = Math.min(THUMBNAIL_SIZE / width, THUMBNAIL_SIZE / height);
  const thumbWidth = Math.round(width * scale);
  const thumbHeight = Math.round(height * scale);

  // For now, copy source as placeholder - actual resize needs native module
  await FileSystem.copyAsync({ from: sourceUri, to: destPath });
  
  return destPath;
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject,
    );
  });
}

export async function clearThumbnailCache(): Promise<void> {
  memoryCache.clear();
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (info.exists) {
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
  }
}

export function getThumbnailCacheSize(): number {
  return memoryCache.size;
}

export async function preloadThumbnails(
  items: Array<{ assetId: string; uri: string }>,
): Promise<void> {
  await ensureCacheDirectory();
  await Promise.all(
    items.map(item => getThumbnail(item.assetId, item.uri).catch(() => null))
  );
}
```

- [ ] **Step 3.1.2: Commit**

```bash
git add src/services/batch/thumbnail-cache.service.ts
git commit -m "feat(batch): add thumbnail cache service"
```

---

## Task 4: Batch Workspace Service

### Step 4.1: Create workspace service

- [ ] **Step 4.1.1: Implement service**

```typescript
// src/services/batch/batch-workspace.service.ts
import * as MediaLibrary from 'expo-media-library';
import type { BatchItem, BatchWorkspace } from '@core/batch/batch-model';
import { createBatchItem, createBatchWorkspace, MAX_BATCH_SIZE } from '@core/batch/batch-model';
import { preloadThumbnails } from './thumbnail-cache.service';

export interface BatchSelectionResult {
  workspace: BatchWorkspace;
  skipped: number;
}

export async function createWorkspaceFromAssets(
  assetIds: string[],
): Promise<BatchSelectionResult> {
  const limitedIds = assetIds.slice(0, MAX_BATCH_SIZE);
  const skipped = assetIds.length - limitedIds.length;

  const assets = await Promise.all(
    limitedIds.map(id => MediaLibrary.getAssetInfoAsync(id))
  );

  const items: BatchItem[] = assets
    .filter((asset): asset is MediaLibrary.AssetInfo => asset !== null)
    .map(asset => createBatchItem(
      asset.id,
      asset.localUri ?? asset.uri,
      asset.width,
      asset.height,
      asset.filename,
    ));

  const workspace = createBatchWorkspace(items);

  // Preload thumbnails in background
  preloadThumbnails(items.map(i => ({ assetId: i.assetId, uri: i.uri }))).catch(() => {});

  return { workspace, skipped };
}

export async function getRecentAssets(
  limit: number = 50,
): Promise<MediaLibrary.Asset[]> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    return [];
  }

  const { assets } = await MediaLibrary.getAssetsAsync({
    first: limit,
    mediaType: MediaLibrary.MediaType.photo,
    sortBy: [MediaLibrary.SortBy.creationTime],
  });

  return assets;
}

export async function getAlbums(): Promise<MediaLibrary.Album[]> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    return [];
  }

  const albums = await MediaLibrary.getAlbumsAsync({
    includeSmartAlbums: true,
  });

  return albums.filter(album => album.assetCount > 0);
}

export async function getAlbumAssets(
  albumId: string,
  limit: number = 50,
): Promise<MediaLibrary.Asset[]> {
  const album = await MediaLibrary.getAlbumAsync(albumId);
  if (!album) return [];

  const { assets } = await MediaLibrary.getAssetsAsync({
    first: limit,
    album,
    mediaType: MediaLibrary.MediaType.photo,
    sortBy: [MediaLibrary.SortBy.creationTime],
  });

  return assets;
}
```

- [ ] **Step 4.1.2: Commit**

```bash
git add src/services/batch/batch-workspace.service.ts
git commit -m "feat(batch): add batch workspace service"
```

---

## Task 5: Barrel Export

### Step 5.1: Create index files

- [ ] **Step 5.1.1: Create core barrel**

```typescript
// src/core/batch/index.ts
export type {
  BatchItem,
  BatchItemStatus,
  BatchWorkspace,
} from './batch-model';
export {
  MAX_BATCH_SIZE,
  createBatchItem,
  createBatchWorkspace,
  getBatchProgress,
} from './batch-model';

export type { BatchWorkspaceAction } from './batch-workspace';
export {
  batchWorkspaceReducer,
  getActiveItem,
  getNextPendingItem,
  getAllReadyItems,
} from './batch-workspace';
```

- [ ] **Step 5.1.2: Create service barrel**

```typescript
// src/services/batch/index.ts
export {
  createWorkspaceFromAssets,
  getRecentAssets,
  getAlbums,
  getAlbumAssets,
  type BatchSelectionResult,
} from './batch-workspace.service';

export {
  getThumbnail,
  clearThumbnailCache,
  getThumbnailCacheSize,
  preloadThumbnails,
  ensureCacheDirectory,
} from './thumbnail-cache.service';
```

- [ ] **Step 5.1.3: Commit**

```bash
git add src/core/batch/index.ts src/services/batch/index.ts
git commit -m "feat(batch): add barrel exports"
```

---

## Completion Checklist

- [ ] BatchItem and BatchWorkspace models
- [ ] Workspace reducer with actions
- [ ] Thumbnail cache service
- [ ] Batch workspace service with media library integration
- [ ] Tests pass

**Next:** Phase 3B - Batch Export
