# Phase 3C: Batch UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Phase 3 batch workspace UI so users can select up to 20 photos, browse an active preview, apply one shared look, and launch batch export from Home.

**Architecture:** Keep all batch UI inside `src/features/batch/`, with `useBatchSession` coordinating the Phase 3A/3B services. Home only links into Batch; it does not own batch state. The batch screen reuses existing preset browsing and UI primitives instead of inventing a parallel component system.

**Tech Stack:** React Native, Expo Router, expo-media-library, existing `@ui` primitives/layout, Phase 3A/3B batch services

**Prerequisites:** Phase 1C/1F, Phase 2D, Phase 3A, and Phase 3B complete.

---

## File Structure

### New Files

| Path | Responsibility |
|------|----------------|
| `src/features/batch/batch-photo-picker.tsx` | Recent/Albums picker for up to 20 assets |
| `src/features/batch/batch-thumbnail-strip.tsx` | Horizontal workspace strip with add/select affordances |
| `src/features/batch/batch-preview.tsx` | Active batch preview with prev/next/remove controls |
| `src/features/batch/use-batch-session.ts` | Batch screen orchestration hook |
| `src/features/batch/batch.screen.tsx` | Phase 3 batch workspace screen |
| `src/features/batch/index.ts` | Batch feature barrel |
| `app/batch.tsx` | Expo Router batch route |
| `__tests__/features/batch-photo-picker.test.tsx` | Picker behavior coverage |
| `__tests__/features/batch-preview.test.tsx` | Thumbnail strip + preview coverage |
| `__tests__/features/use-batch-session.test.tsx` | Session orchestration coverage |
| `__tests__/features/batch.screen.test.tsx` | Screen wiring coverage |

### Modified Files

| Path | Changes |
|------|---------|
| `app/_layout.tsx` | Register `batch` stack route |
| `src/features/home/home.screen.tsx` | Add Phase 3 batch entry CTA |

---

## Task 1: Batch Photo Picker

**Files:**
- Create: `src/features/batch/batch-photo-picker.tsx`
- Test: `__tests__/features/batch-photo-picker.test.tsx`

- [ ] **Step 1: Write the failing picker test**

```tsx
// __tests__/features/batch-photo-picker.test.tsx
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { BatchPhotoPicker } from '@features/batch/batch-photo-picker';
import { getAlbumAssets, getAlbums, getRecentAssets } from '@services/batch';

jest.mock('@services/batch', () => ({
  getRecentAssets: jest.fn(),
  getAlbums: jest.fn(),
  getAlbumAssets: jest.fn(),
}));

const mockedGetRecentAssets = jest.mocked(getRecentAssets);
const mockedGetAlbums = jest.mocked(getAlbums);
const mockedGetAlbumAssets = jest.mocked(getAlbumAssets);

const RECENT = [
  { id: 'asset-1', uri: 'file:///1.jpg', filename: '1.jpg' },
  { id: 'asset-2', uri: 'file:///2.jpg', filename: '2.jpg' },
];

const ALBUMS = [{ id: 'album-1', title: 'Portraits', assetCount: 8 }];

describe('BatchPhotoPicker', () => {
  beforeEach(() => {
    mockedGetRecentAssets.mockResolvedValue(RECENT as never);
    mockedGetAlbums.mockResolvedValue(ALBUMS as never);
    mockedGetAlbumAssets.mockResolvedValue(RECENT as never);
  });

  it('loads recent assets, switches to albums, and confirms selected ids', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    const screen = render(
      <BatchPhotoPicker
        visible
        selectedAssetIds={[]}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('1.jpg')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Albums'));
    await waitFor(() => {
      expect(screen.getByText('Portraits')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Portraits'));
    await waitFor(() => {
      expect(screen.getByText('2.jpg')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Select 1.jpg'));
    fireEvent.press(screen.getByText('Add 1 Photos'));

    expect(onConfirm).toHaveBeenCalledWith(['asset-1']);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the picker test to verify it fails**

Run: `npm test -- --runInBand batch-photo-picker`
Expected: FAIL with `Cannot find module '@features/batch/batch-photo-picker'`

- [ ] **Step 3: Write the minimal picker implementation**

```tsx
// src/features/batch/batch-photo-picker.tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { getAlbumAssets, getAlbums, getRecentAssets } from '@services/batch';
import { BottomSheet } from '@ui/layout';
import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

interface PickerAsset {
  readonly id: string;
  readonly uri: string;
  readonly filename?: string;
}

interface PickerAlbum {
  readonly id: string;
  readonly title?: string;
  readonly assetCount?: number;
}

export interface BatchPhotoPickerProps {
  readonly visible: boolean;
  readonly selectedAssetIds: readonly string[];
  readonly onClose: () => void;
  readonly onConfirm: (assetIds: string[]) => void;
}

export function BatchPhotoPicker({
  visible,
  selectedAssetIds,
  onClose,
  onConfirm,
}: BatchPhotoPickerProps): React.JSX.Element {
  const [tab, setTab] = React.useState<'recent' | 'albums'>('recent');
  const [assets, setAssets] = React.useState<readonly PickerAsset[]>([]);
  const [albums, setAlbums] = React.useState<readonly PickerAlbum[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([...selectedAssetIds]);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    void getRecentAssets().then((items) => setAssets(items as PickerAsset[]));
    void getAlbums().then((items) => setAlbums(items as PickerAlbum[]));
    setSelectedIds([...selectedAssetIds]);
  }, [selectedAssetIds, visible]);

  const toggleAsset = React.useCallback((assetId: string) => {
    setSelectedIds((current) => {
      if (current.includes(assetId)) {
        return current.filter((id) => id !== assetId);
      }

      if (current.length >= 20) {
        return current;
      }

      return [...current, assetId];
    });
  }, []);

  const openAlbum = React.useCallback(async (albumId: string) => {
    setTab('albums');
    const nextAssets = await getAlbumAssets(albumId);
    setAssets(nextAssets as PickerAsset[]);
  }, []);

  return (
    <BottomSheet visible={visible} title="Select Photos" onClose={onClose}>
      <View style={styles.tabRow}>
        {(['recent', 'albums'] as const).map((key) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              onPress={() => setTab(key)}
              style={[styles.tabButton, active ? styles.activeTab : null]}
            >
              <Text selectable={false} variant="label" color={active ? colors.background : colors.primary}>
                {key === 'recent' ? 'Recent' : 'Albums'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {tab === 'albums' ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          {albums.map((album) => (
            <Pressable key={album.id} onPress={() => openAlbum(album.id)} style={styles.listRow}>
              <Text variant="label">{album.title ?? 'Untitled album'}</Text>
              <Text variant="caption">{album.assetCount ?? 0} photos</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      <ScrollView contentContainerStyle={styles.grid}>
        {assets.map((asset) => {
          const selected = selectedIds.includes(asset.id);
          return (
            <Pressable
              key={asset.id}
              accessibilityLabel={`Select ${asset.filename ?? asset.id}`}
              onPress={() => toggleAsset(asset.id)}
              style={[styles.assetCard, selected ? styles.assetCardSelected : null]}
            >
              <Text selectable={false} variant="label" numberOfLines={1}>
                {asset.filename ?? asset.id}
              </Text>
              <Text selectable={false} variant="caption">
                {selected ? 'Selected' : 'Tap to add'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Button
        label={`Add ${selectedIds.length} Photos`}
        onPress={() => {
          onConfirm(selectedIds);
          onClose();
        }}
        disabled={selectedIds.length === 0}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: spacing.sm },
  tabButton: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: { backgroundColor: colors.accent },
  listContent: { gap: spacing.sm },
  listRow: {
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  assetCard: {
    width: '47%',
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  assetCardSelected: { borderColor: colors.accent },
});
```

- [ ] **Step 4: Run the picker test to verify it passes**

Run: `npm test -- --runInBand batch-photo-picker`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/batch/batch-photo-picker.tsx __tests__/features/batch-photo-picker.test.tsx
git commit -m "$(cat <<'EOF'
Make batch photo selection deterministic before the workspace screen ships

The batch flow needs a single picker surface that can browse recent images,
open albums, and enforce the 20-photo limit before any workspace state exists.

Constraint: Batch v1 must cap selection at 20 photos
Rejected: Reuse the single-image import screen | cannot browse albums or multi-select
Confidence: medium
Scope-risk: moderate
Reversibility: clean
Directive: Keep media-library access in services, not in feature components
Tested: npm test -- --runInBand batch-photo-picker
Not-tested: Manual device permission prompts
EOF
)"
```

---

## Task 2: Batch Thumbnail Strip and Active Preview

**Files:**
- Create: `src/features/batch/batch-thumbnail-strip.tsx`
- Create: `src/features/batch/batch-preview.tsx`
- Test: `__tests__/features/batch-preview.test.tsx`

- [ ] **Step 1: Write failing preview tests**

```tsx
// __tests__/features/batch-preview.test.tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BatchPreview } from '@features/batch/batch-preview';
import { BatchThumbnailStrip } from '@features/batch/batch-thumbnail-strip';

const ITEMS = [
  { id: 'item-1', filename: 'one.jpg', uri: 'file:///1.jpg', status: 'ready' },
  { id: 'item-2', filename: 'two.jpg', uri: 'file:///2.jpg', status: 'pending' },
];

describe('batch preview UI', () => {
  it('selects items from the strip and exposes add more affordance', () => {
    const onSelect = jest.fn();
    const onAddMore = jest.fn();

    const screen = render(
      <BatchThumbnailStrip
        items={ITEMS as never}
        activeItemId="item-1"
        onSelectItem={onSelect}
        onAddMore={onAddMore}
      />,
    );

    fireEvent.press(screen.getByText('two.jpg'));
    fireEvent.press(screen.getByText('+ Add'));

    expect(onSelect).toHaveBeenCalledWith('item-2');
    expect(onAddMore).toHaveBeenCalledTimes(1);
  });

  it('moves between items and removes the active item', () => {
    const onPrevious = jest.fn();
    const onNext = jest.fn();
    const onRemove = jest.fn();

    const screen = render(
      <BatchPreview
        item={ITEMS[0] as never}
        previewUri="file:///preview.jpg"
        index={0}
        total={2}
        onPrevious={onPrevious}
        onNext={onNext}
        onRemove={onRemove}
      />,
    );

    fireEvent.press(screen.getByLabelText('Next batch item'));
    fireEvent.press(screen.getByLabelText('Remove active batch item'));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the preview tests to verify they fail**

Run: `npm test -- --runInBand batch-preview`
Expected: FAIL with missing module errors for the batch preview components

- [ ] **Step 3: Implement the strip and preview components**

```tsx
// src/features/batch/batch-thumbnail-strip.tsx
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

interface BatchListItem {
  readonly id: string;
  readonly filename?: string;
  readonly status: string;
}

export interface BatchThumbnailStripProps {
  readonly items: readonly BatchListItem[];
  readonly activeItemId: string | null;
  readonly onSelectItem: (itemId: string) => void;
  readonly onAddMore: () => void;
}

export function BatchThumbnailStrip({
  items,
  activeItemId,
  onSelectItem,
  onAddMore,
}: BatchThumbnailStripProps): React.JSX.Element {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      <Pressable onPress={onAddMore} style={[styles.card, styles.addCard]}>
        <Text selectable={false} variant="label">+ Add</Text>
      </Pressable>
      {items.map((item) => {
        const active = item.id === activeItemId;
        return (
          <Pressable
            key={item.id}
            onPress={() => onSelectItem(item.id)}
            style={[styles.card, active ? styles.activeCard : null]}
          >
            <Text selectable={false} variant="label" numberOfLines={1}>
              {item.filename ?? item.id}
            </Text>
            <Text selectable={false} variant="caption">{item.status}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingRight: spacing.md },
  card: {
    width: 92,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  addCard: { alignItems: 'center', justifyContent: 'center' },
  activeCard: { borderColor: colors.accent },
});
```

```tsx
// src/features/batch/batch-preview.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PreviewCanvas } from '@adapters/skia/preview-canvas';
import { IconButton, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

interface BatchPreviewItem {
  readonly id: string;
  readonly filename?: string;
  readonly uri: string;
}

export interface BatchPreviewProps {
  readonly item: BatchPreviewItem | null;
  readonly previewUri: string | null;
  readonly index: number;
  readonly total: number;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onRemove: () => void;
}

export function BatchPreview({
  item,
  previewUri,
  index,
  total,
  onPrevious,
  onNext,
  onRemove,
}: BatchPreviewProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="label">{item?.filename ?? 'No active photo'}</Text>
        <Text variant="caption">{total === 0 ? '0 / 0' : `${index + 1} / ${total}`}</Text>
      </View>

      <View style={styles.previewCard}>
        {item && previewUri ? (
          <PreviewCanvas imageUri={previewUri} width={280} height={280} />
        ) : (
          <Text variant="caption">Choose photos to begin the batch workspace.</Text>
        )}
      </View>

      <View style={styles.actions}>
        <IconButton icon="←" accessibilityLabel="Previous batch item" onPress={onPrevious} disabled={index <= 0} />
        <IconButton icon="🗑" accessibilityLabel="Remove active batch item" onPress={onRemove} disabled={!item} />
        <IconButton icon="→" accessibilityLabel="Next batch item" onPress={onNext} disabled={!item || index >= total - 1} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewCard: {
    minHeight: 320,
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
});
```

- [ ] **Step 4: Run the preview tests to verify they pass**

Run: `npm test -- --runInBand batch-preview`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/batch/batch-thumbnail-strip.tsx src/features/batch/batch-preview.tsx __tests__/features/batch-preview.test.tsx
git commit -m "$(cat <<'EOF'
Give the batch workspace a visible active-photo model before session orchestration lands

The batch screen needs a thumbnail strip and a single active preview so users can
understand which item they are changing before preset application and export exist.

Constraint: Batch v1 keeps one active preview, not full multi-canvas editing
Rejected: Render every photo in a grid editor | too memory-heavy for the first batch cut
Confidence: medium
Scope-risk: moderate
Reversibility: clean
Directive: Keep the strip dumb and let the hook own workspace state
Tested: npm test -- --runInBand batch-preview
Not-tested: Real-device image loading performance
EOF
)"
```

---

## Task 3: Batch Session Hook

**Files:**
- Create: `src/features/batch/use-batch-session.ts`
- Test: `__tests__/features/use-batch-session.test.tsx`

- [ ] **Step 1: Write the failing session-hook test**

```tsx
// __tests__/features/use-batch-session.test.tsx
import { act, renderHook } from '@testing-library/react-native';

import { useBatchSession } from '@features/batch/use-batch-session';
import { createWorkspaceFromAssets, startBatchExport } from '@services/batch';

jest.mock('@services/batch', () => ({
  createWorkspaceFromAssets: jest.fn(),
  startBatchExport: jest.fn(),
}));

const mockedCreateWorkspaceFromAssets = jest.mocked(createWorkspaceFromAssets);
const mockedStartBatchExport = jest.mocked(startBatchExport);

describe('useBatchSession', () => {
  it('creates a workspace, applies a preset to all items, and starts export', async () => {
    mockedCreateWorkspaceFromAssets.mockResolvedValue({
      workspace: {
        id: 'workspace-1',
        items: [
          { id: 'item-1', assetId: 'asset-1', uri: 'file:///1.jpg', width: 1000, height: 800, filename: '1.jpg', editState: null, status: 'pending', exportedUri: null, error: null },
        ],
        activeItemId: 'item-1',
        createdAt: 1,
        updatedAt: 1,
      },
      skipped: 0,
    } as never);
    mockedStartBatchExport.mockResolvedValue({ status: 'completed' } as never);

    const { result } = renderHook(() => useBatchSession());

    await act(async () => {
      await result.current.createWorkspace(['asset-1']);
    });

    act(() => {
      result.current.setSharedPreset('preset-1');
      result.current.setIntensity(0.85);
    });

    act(() => {
      result.current.applyPresetToAll();
    });

    await act(async () => {
      await result.current.exportAll();
    });

    expect(result.current.workspace?.items[0].editState?.selectedPresetId).toBe('preset-1');
    expect(mockedStartBatchExport).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the session-hook test to verify it fails**

Run: `npm test -- --runInBand use-batch-session`
Expected: FAIL with missing hook module error

- [ ] **Step 3: Implement the hook**

```ts
// src/features/batch/use-batch-session.ts
import React from 'react';

import { createInitialEditState, DEFAULT_ADJUSTMENTS } from '@core/edit-session/edit-state';
import { buildPreviewRequest, renderPreview } from '@services/image/preview-render.service';
import { createWorkspaceFromAssets, startBatchExport } from '@services/batch';

interface BatchItem {
  readonly id: string;
  readonly assetId: string;
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  readonly filename: string;
  readonly editState: ReturnType<typeof createInitialEditState> | null;
  readonly status: string;
  readonly exportedUri: string | null;
  readonly error: string | null;
}

interface BatchWorkspace {
  readonly id: string;
  readonly items: readonly BatchItem[];
  readonly activeItemId: string | null;
}

export function useBatchSession() {
  const [workspace, setWorkspace] = React.useState<BatchWorkspace | null>(null);
  const [pickerVisible, setPickerVisible] = React.useState(false);
  const [sharedPresetId, setSharedPreset] = React.useState<string | null>(null);
  const [intensity, setIntensity] = React.useState(1);
  const [previewUri, setPreviewUri] = React.useState<string | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  const activeIndex = React.useMemo(() => {
    if (!workspace?.activeItemId) {
      return -1;
    }

    return workspace.items.findIndex((item) => item.id === workspace.activeItemId);
  }, [workspace]);

  const activeItem = activeIndex >= 0 && workspace ? workspace.items[activeIndex] : null;

  React.useEffect(() => {
    if (!activeItem?.editState) {
      setPreviewUri(activeItem?.uri ?? null);
      return;
    }

    void renderPreview(buildPreviewRequest(activeItem.editState))
      .then((result) => setPreviewUri(result.uri))
      .catch(() => setPreviewUri(activeItem.uri));
  }, [activeItem]);

  const createWorkspace = React.useCallback(async (assetIds: string[]) => {
    setError(null);
    const result = await createWorkspaceFromAssets(assetIds);
    setWorkspace(result.workspace as BatchWorkspace);
  }, []);

  const selectItem = React.useCallback((itemId: string) => {
    setWorkspace((current) => current ? { ...current, activeItemId: itemId } : current);
  }, []);

  const removeItem = React.useCallback(() => {
    setWorkspace((current) => {
      if (!current?.activeItemId) {
        return current;
      }

      const items = current.items.filter((item) => item.id !== current.activeItemId);
      return {
        ...current,
        items,
        activeItemId: items[0]?.id ?? null,
      };
    });
  }, []);

  const applyPresetToAll = React.useCallback(() => {
    if (!workspace || !sharedPresetId) {
      return;
    }

    setWorkspace({
      ...workspace,
      items: workspace.items.map((item) => ({
        ...item,
        status: 'ready',
        editState: {
          ...createInitialEditState(item.assetId, item.uri, item.width, item.height),
          selectedPresetId: sharedPresetId,
          adjustments: {
            ...DEFAULT_ADJUSTMENTS,
            intensity,
          },
        },
      })),
    });
  }, [intensity, sharedPresetId, workspace]);

  const exportAll = React.useCallback(async () => {
    if (!workspace) {
      return;
    }

    await startBatchExport(
      workspace as never,
      {},
      () => undefined,
      () => undefined,
    );
  }, [workspace]);

  return {
    workspace,
    activeItem,
    activeIndex,
    pickerVisible,
    previewUri,
    sharedPresetId,
    intensity,
    error,
    openPicker: () => setPickerVisible(true),
    closePicker: () => setPickerVisible(false),
    createWorkspace,
    selectItem,
    removeItem,
    setSharedPreset,
    setIntensity,
    applyPresetToAll,
    exportAll,
  };
}
```

- [ ] **Step 4: Run the hook test to verify it passes**

Run: `npm test -- --runInBand use-batch-session`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/batch/use-batch-session.ts __tests__/features/use-batch-session.test.tsx
git commit -m "$(cat <<'EOF'
Centralize batch screen state before wiring the screen and route

The batch workspace UI should stay thin. The hook owns picker state, shared preset
application, active-item selection, preview fallback, and export orchestration.

Constraint: Batch applies one shared look to all items in v1
Rejected: Keep state inside BatchScreen | makes preview, export, and picker flows harder to test
Confidence: medium
Scope-risk: moderate
Reversibility: clean
Directive: Preserve asset-specific edit state when applying the shared preset to all items
Tested: npm test -- --runInBand use-batch-session
Not-tested: Partial export failure updates from the real queue
EOF
)"
```

---

## Task 4: Batch Screen, Route, and Home Entry

**Files:**
- Create: `src/features/batch/batch.screen.tsx`
- Create: `src/features/batch/index.ts`
- Create: `app/batch.tsx`
- Test: `__tests__/features/batch.screen.test.tsx`
- Modify: `app/_layout.tsx`
- Modify: `src/features/home/home.screen.tsx`

- [ ] **Step 1: Write the failing screen test**

```tsx
// __tests__/features/batch.screen.test.tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BatchScreen } from '@features/batch/batch.screen';
import { useBatchSession } from '@features/batch/use-batch-session';
import { usePresetBrowser } from '@features/preset-browser';

jest.mock('@features/batch/use-batch-session', () => ({
  useBatchSession: jest.fn(),
}));

jest.mock('@features/preset-browser', () => ({
  PresetBrowser: ({ onSelectPreset }: { onSelectPreset: (presetId: string) => void }) => null,
  usePresetBrowser: jest.fn(),
}));

const mockedUseBatchSession = jest.mocked(useBatchSession);
const mockedUsePresetBrowser = jest.mocked(usePresetBrowser);

describe('BatchScreen', () => {
  it('opens the picker and applies the selected preset to all items', () => {
    const openPicker = jest.fn();
    const applyPresetToAll = jest.fn();

    mockedUseBatchSession.mockReturnValue({
      workspace: { items: [], activeItemId: null },
      activeItem: null,
      activeIndex: -1,
      pickerVisible: false,
      previewUri: null,
      sharedPresetId: 'preset-1',
      intensity: 1,
      error: null,
      openPicker,
      closePicker: jest.fn(),
      createWorkspace: jest.fn(),
      selectItem: jest.fn(),
      removeItem: jest.fn(),
      setSharedPreset: jest.fn(),
      setIntensity: jest.fn(),
      applyPresetToAll,
      exportAll: jest.fn(),
    } as never);

    mockedUsePresetBrowser.mockReturnValue({
      presets: [{ id: 'preset-1', name: 'LC1', category: 'portrait' }],
      categories: ['all', 'portrait'],
      selectedCategory: 'all',
      setSelectedCategory: jest.fn(),
      selectedPresetId: 'preset-1',
      setSelectedPresetId: jest.fn(),
      isLoading: false,
    } as never);

    const screen = render(<BatchScreen />);

    fireEvent.press(screen.getByText('Add Photos'));
    fireEvent.press(screen.getByText('Apply All'));

    expect(openPicker).toHaveBeenCalledTimes(1);
    expect(applyPresetToAll).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the screen test to verify it fails**

Run: `npm test -- --runInBand batch.screen`
Expected: FAIL with missing screen module error

- [ ] **Step 3: Implement the screen, route, and home integration**

```tsx
// src/features/batch/batch.screen.tsx
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BatchPhotoPicker } from './batch-photo-picker';
import { BatchPreview } from './batch-preview';
import { BatchThumbnailStrip } from './batch-thumbnail-strip';
import { useBatchSession } from './use-batch-session';
import { PresetBrowser, usePresetBrowser } from '@features/preset-browser';
import { Button, Slider, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

export function BatchScreen(): React.JSX.Element {
  const session = useBatchSession();
  const presets = usePresetBrowser();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="heading">Batch Process</Text>
        <Button label="Export" onPress={() => void session.exportAll()} disabled={!session.workspace?.items.length} />
      </View>

      <BatchThumbnailStrip
        items={session.workspace?.items ?? []}
        activeItemId={session.workspace?.activeItemId ?? null}
        onSelectItem={session.selectItem}
        onAddMore={session.openPicker}
      />

      <BatchPreview
        item={session.activeItem}
        previewUri={session.previewUri}
        index={session.activeIndex}
        total={session.workspace?.items.length ?? 0}
        onPrevious={() => {
          const items = session.workspace?.items ?? [];
          const previous = items[session.activeIndex - 1];
          if (previous) session.selectItem(previous.id);
        }}
        onNext={() => {
          const items = session.workspace?.items ?? [];
          const next = items[session.activeIndex + 1];
          if (next) session.selectItem(next.id);
        }}
        onRemove={session.removeItem}
      />

      <View style={styles.panel}>
        <Text variant="label">Shared intensity</Text>
        <Slider value={session.intensity} minimumValue={0} maximumValue={1} step={0.05} onValueChange={session.setIntensity} />
        <Button label="Apply All" onPress={session.applyPresetToAll} disabled={!session.sharedPresetId || !session.workspace?.items.length} />
      </View>

      <PresetBrowser
        presets={presets.presets}
        categories={presets.categories}
        selectedCategory={presets.selectedCategory}
        selectedPresetId={session.sharedPresetId}
        isLoading={presets.isLoading}
        onSelectCategory={presets.setSelectedCategory}
        onSelectPreset={session.setSharedPreset}
      />

      <Button label="Add Photos" variant="secondary" onPress={session.openPicker} />

      <BatchPhotoPicker
        visible={session.pickerVisible}
        selectedAssetIds={session.workspace?.items.map((item) => item.assetId) ?? []}
        onClose={session.closePicker}
        onConfirm={(assetIds) => {
          void session.createWorkspace(assetIds);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panel: {
    gap: spacing.md,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
});
```

```ts
// src/features/batch/index.ts
export * from './batch-photo-picker';
export * from './batch-preview';
export * from './batch-thumbnail-strip';
export * from './batch.screen';
export * from './use-batch-session';
```

```tsx
// app/batch.tsx
import React from 'react';

import { BatchScreen } from '@features/batch';

export default function BatchRoute(): React.JSX.Element {
  return <BatchScreen />;
}
```

```tsx
// app/_layout.tsx (add one stack entry)
<Stack.Screen name="batch" options={{ title: 'Batch', headerShown: false }} />
```

```tsx
// src/features/home/home.screen.tsx (add inside the existing actions area)
<Button
  label="Batch"
  variant="secondary"
  onPress={() => router.push('/batch')}
/>
```

- [ ] **Step 4: Run the screen test to verify it passes**

Run: `npm test -- --runInBand batch.screen`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/batch src/features/home/home.screen.tsx app/batch.tsx app/_layout.tsx __tests__/features/batch.screen.test.tsx
git commit -m "$(cat <<'EOF'
Expose the batch workspace as a first-class screen once the batch services are ready

The Phase 3 batch route should feel native to the app shell: reachable from Home,
backed by the shared preset browser, and centered on a single active preview.

Constraint: Home only links into batch; batch state must stay inside the batch feature
Rejected: Build batch as an editor modal | too large for the editor route and back-stack rules
Confidence: medium
Scope-risk: moderate
Reversibility: clean
Directive: Keep the batch route hidden behind Phase 3 prerequisites until Home exists
Tested: npm test -- --runInBand batch.screen
Not-tested: Manual navigation and photo-library flows on device
EOF
)"
```

---

## Completion Checklist

- [ ] Batch photo picker supports Recent + Albums and enforces the 20-photo cap
- [ ] Thumbnail strip and active preview are wired to the session hook
- [ ] Batch screen reuses preset browser + intensity slider + export entry
- [ ] Batch route exists and Home can navigate to it
- [ ] Focused picker/hook/screen tests pass

**Next:** Phase 3D - Blend Tool
