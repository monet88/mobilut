# Phase 1 Shell Catch-up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining Phase 1 redesign work after render-parity so Home, Editor, and Settings match the approved spec and Phase 2/3 have a stable base.

**Architecture:** Treat `docs/superpowers/plans/phase-1a-render-parity.md` as a hard prerequisite for truthful preview/export. This plan then adds file-backed draft persistence, routes `app/index.tsx` to a new draft-first Home screen, hydrates the editor from saved drafts, wraps the existing crop/adjust/LUT/export surfaces in bottom sheets, and trims Settings down to the English-only v1 surface.

**Tech Stack:** React Native, Expo Router, expo-file-system adapter, Async reducer state, Jest, `@testing-library/react-native`

---

**Scope note:** The redesign spans multiple subsystems. This updated plan intentionally covers the remaining **Phase 1 shell/data work only**. Keep Phase 2 and Phase 3 as separate follow-up plans after this file and `phase-1a-render-parity.md` are done.

## File Structure

### New Files

| Path | Responsibility |
|------|----------------|
| `src/core/draft/draft-model.ts` | Draft record + summary types used by Home and Editor |
| `src/core/draft/index.ts` | Draft barrel exports |
| `src/services/storage/draft-store.ts` | File-backed draft save/load/list/delete helpers |
| `src/features/home/use-drafts.ts` | Home hook for loading + deleting draft summaries |
| `src/features/home/draft-grid.tsx` | Horizontal draft resume list |
| `src/features/home/home.screen.tsx` | Draft-first Home screen mounted at `app/index.tsx` |
| `src/features/home/index.ts` | Home feature barrel |
| `src/features/editor/tool-sheet.tsx` | Full tools catalog bottom sheet |
| `src/features/editor/modification-log-sheet.tsx` | History bottom sheet built from saved snapshots |
| `__tests__/services/draft-store.test.ts` | Draft-store coverage |
| `__tests__/features/home.screen.test.tsx` | Home screen integration coverage |
| `__tests__/features/use-editor-session.test.ts` | Draft hydration + autosave coverage |
| `__tests__/features/editor.screen.test.tsx` | Editor shell + sheet wiring coverage |
| `__tests__/features/settings.screen.test.tsx` | Settings v1 scope coverage |

### Modified Files

| Path | Changes |
|------|---------|
| `src/adapters/expo/file-system.ts` | Add directory helper for file-backed draft storage |
| `src/services/storage/index.ts` | Export draft-store API |
| `src/features/editor/use-editor-session.ts` | Load draft on mount, autosave on edits |
| `src/features/editor/editor-reducer.ts` | Add `HYDRATE` action for saved history |
| `src/features/editor/editor.screen.tsx` | Replace inline controls with top bar + bottom toolbar + sheets |
| `app/index.tsx` | Mount new Home screen instead of import-first landing screen |
| `src/services/storage/app-preferences.ts` | Default v1 language to English |
| `src/i18n/index.ts` | Default initialization language to English |
| `src/features/settings/settings.screen.tsx` | Remove language picker and theme UI from v1 surface |

---

## Task 1: Add file-backed draft storage

**Files:**
- Create: `src/core/draft/draft-model.ts`
- Create: `src/core/draft/index.ts`
- Create: `src/services/storage/draft-store.ts`
- Modify: `src/adapters/expo/file-system.ts`
- Modify: `src/services/storage/index.ts`
- Test: `__tests__/services/draft-store.test.ts`

- [ ] **Step 1: Write the failing draft-store test**

```ts
// __tests__/services/draft-store.test.ts
import { createInitialEditState } from '@core/edit-session/edit-state';
import { deleteDraft, listDrafts, loadDraft, saveDraft } from '@services/storage/draft-store';

const fileMap = new Map<string, string>();

jest.mock('@adapters/expo/file-system', () => ({
  ensureDirectory: jest.fn(async () => undefined),
  readFileAsText: jest.fn(async (uri: string) => {
    const value = fileMap.get(uri);
    if (typeof value !== 'string') {
      throw new Error(`ENOENT: ${uri}`);
    }
    return value;
  }),
  writeFile: jest.fn(async (uri: string, content: string) => {
    fileMap.set(uri, content);
  }),
  deleteFile: jest.fn(async (uri: string) => {
    fileMap.delete(uri);
  }),
  getDocumentDirectory: jest.fn(() => 'file:///documents/'),
}));

describe('draft-store', () => {
  beforeEach(() => {
    fileMap.clear();
  });

  it('saves, lists, loads, and deletes drafts by asset id', async () => {
    const editState = createInitialEditState('asset-1', 'file:///photo.jpg', 1200, 900);

    await saveDraft({
      summary: {
        assetId: 'asset-1',
        assetUri: 'file:///photo.jpg',
        previewUri: 'file:///photo.jpg',
        createdAt: 1,
        updatedAt: 1,
      },
      history: {
        past: [],
        present: editState,
        future: [],
      },
    });

    await expect(listDrafts()).resolves.toEqual([
      expect.objectContaining({ assetId: 'asset-1', previewUri: 'file:///photo.jpg' }),
    ]);
    await expect(loadDraft('asset-1')).resolves.toEqual(
      expect.objectContaining({ summary: expect.objectContaining({ assetId: 'asset-1' }) }),
    );

    await deleteDraft('asset-1');

    await expect(listDrafts()).resolves.toEqual([]);
    await expect(loadDraft('asset-1')).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand draft-store`
Expected: FAIL with `Cannot find module '@services/storage/draft-store'`

- [ ] **Step 3: Add the missing directory helper to the file-system adapter**

```ts
// src/adapters/expo/file-system.ts
import * as FileSystem from 'expo-file-system';

export async function ensureDirectory(uri: string): Promise<void> {
  await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
}
```

- [ ] **Step 4: Create the draft types**

```ts
// src/core/draft/draft-model.ts
import type { History } from '@core/edit-session/history';
import type { EditState } from '@core/edit-session/edit-state';

export interface DraftSummary {
  readonly assetId: string;
  readonly assetUri: string;
  readonly previewUri: string | null;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface DraftRecord {
  readonly summary: DraftSummary;
  readonly history: History<EditState>;
}
```

```ts
// src/core/draft/index.ts
export type { DraftRecord, DraftSummary } from './draft-model';
```

- [ ] **Step 5: Implement the draft store and export it**

```ts
// src/services/storage/draft-store.ts
import type { DraftRecord, DraftSummary } from '@core/draft';
import {
  deleteFile,
  ensureDirectory,
  getDocumentDirectory,
  readFileAsText,
  writeFile,
} from '@adapters/expo/file-system';

const DRAFTS_DIR = `${getDocumentDirectory()}drafts/`;
const INDEX_FILE = `${DRAFTS_DIR}index.json`;

function draftFile(assetId: string): string {
  return `${DRAFTS_DIR}${encodeURIComponent(assetId)}.json`;
}

async function readIndex(): Promise<readonly DraftSummary[]> {
  try {
    const raw = await readFileAsText(INDEX_FILE);
    return JSON.parse(raw) as readonly DraftSummary[];
  } catch {
    return [];
  }
}

async function writeIndex(index: readonly DraftSummary[]): Promise<void> {
  await ensureDirectory(DRAFTS_DIR);
  await writeFile(INDEX_FILE, JSON.stringify(index));
}

export async function saveDraft(record: DraftRecord): Promise<void> {
  await ensureDirectory(DRAFTS_DIR);
  await writeFile(draftFile(record.summary.assetId), JSON.stringify(record));

  const index = await readIndex();
  const nextIndex = [record.summary, ...index.filter((item) => item.assetId !== record.summary.assetId)]
    .sort((left, right) => right.updatedAt - left.updatedAt);

  await writeIndex(nextIndex);
}

export async function loadDraft(assetId: string): Promise<DraftRecord | null> {
  try {
    const raw = await readFileAsText(draftFile(assetId));
    return JSON.parse(raw) as DraftRecord;
  } catch {
    return null;
  }
}

export async function listDrafts(): Promise<readonly DraftSummary[]> {
  return readIndex();
}

export async function deleteDraft(assetId: string): Promise<void> {
  await deleteFile(draftFile(assetId));
  const index = await readIndex();
  await writeIndex(index.filter((item) => item.assetId !== assetId));
}
```

```ts
// src/services/storage/index.ts
export * from './app-preferences';
export * from './draft-store';
export * from './imported-lut-store';
export * from './recent-items';
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- --runInBand draft-store`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/adapters/expo/file-system.ts src/core/draft src/services/storage __tests__/services/draft-store.test.ts

git commit -m "$(cat <<'EOF'
Persist editor drafts as file-backed records keyed by asset id

Home and editor hydration both need one draft source of truth before the
Phase 1 redesign can work reliably.

Constraint: Draft storage must work offline and survive app restarts
Rejected: Store draft history only in React state | no resume path from Home
Confidence: high
Scope-risk: narrow
Reversibility: clean
Directive: Keep draft file names derived from asset ids so Home -> Editor routing stays simple
Tested: npm test -- --runInBand draft-store
Not-tested: Real-device expo-file-system permissions or disk-full behavior
EOF
)"
```

---

## Task 2: Replace the import-first landing route with a draft-first Home screen

**Files:**
- Create: `src/features/home/use-drafts.ts`
- Create: `src/features/home/draft-grid.tsx`
- Create: `src/features/home/home.screen.tsx`
- Create: `src/features/home/index.ts`
- Modify: `app/index.tsx`
- Test: `__tests__/features/home.screen.test.tsx`

- [ ] **Step 1: Write the failing Home screen test**

```tsx
// __tests__/features/home.screen.test.tsx
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { HomeScreen } from '@features/home';

const push = jest.fn();
const pickImage = jest.fn();
const saveDraft = jest.fn(async () => undefined);
const addRecentItem = jest.fn(async () => undefined);
const getRecentItems = jest.fn(async () => []);

jest.mock('expo-router', () => ({
  useRouter: () => ({ push }),
}));

jest.mock('@features/import-image', () => ({
  useImportImage: () => ({ isLoading: false, error: null, pickImage }),
}));

jest.mock('@features/home/use-drafts', () => ({
  useDrafts: () => ({
    drafts: [
      {
        assetId: 'asset-1',
        assetUri: 'file:///draft.jpg',
        previewUri: 'file:///draft.jpg',
        createdAt: 1,
        updatedAt: 2,
      },
    ],
    isLoading: false,
    error: null,
    refresh: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock('@services/storage', () => ({
  addRecentItem,
  getRecentItems,
  saveDraft,
}));

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the Phase 1 home layout and creates a draft before routing to the editor', async () => {
    pickImage.mockResolvedValue({
      id: 'asset-2',
      uri: 'file:///new.jpg',
      width: 1600,
      height: 1200,
      format: 'jpeg',
      fileSize: null,
    });

    const screen = render(<HomeScreen />);

    expect(screen.getByText('Add New Photo')).toBeTruthy();
    expect(screen.getByText('Continue Editing')).toBeTruthy();

    fireEvent.press(screen.getByText('Add New Photo'));

    await waitFor(() => {
      expect(saveDraft).toHaveBeenCalledTimes(1);
      expect(push).toHaveBeenCalledWith('/editor/asset-2');
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand home.screen`
Expected: FAIL with `Cannot find module '@features/home'`

- [ ] **Step 3: Create the Home hook, grid, screen, and barrel**

```ts
// src/features/home/use-drafts.ts
import { useCallback, useEffect, useState } from 'react';

import type { DraftSummary } from '@core/draft';
import { deleteDraft, listDrafts } from '@services/storage';

export function useDrafts() {
  const [drafts, setDrafts] = useState<readonly DraftSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDrafts(await listDrafts());
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (assetId: string) => {
    await deleteDraft(assetId);
    setDrafts((current) => current.filter((draft) => draft.assetId !== assetId));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { drafts, isLoading, error, refresh, remove };
}
```

```tsx
// src/features/home/draft-grid.tsx
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { DraftSummary } from '@core/draft';
import { IconButton, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

interface DraftGridProps {
  readonly drafts: readonly DraftSummary[];
  readonly onDraftPress: (assetId: string) => void;
  readonly onDeleteDraft: (assetId: string) => void;
}

export function DraftGrid({ drafts, onDraftPress, onDeleteDraft }: DraftGridProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text variant="label">Continue Editing</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {drafts.map((draft) => (
          <Pressable key={draft.assetId} style={styles.card} onPress={() => onDraftPress(draft.assetId)}>
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
                onPress={() => onDeleteDraft(draft.assetId)}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { gap: spacing.md, paddingVertical: spacing.xs },
  card: { width: 160, gap: spacing.sm },
  preview: { width: 160, height: 160, borderRadius: 16, backgroundColor: colors.surface },
  previewFallback: { backgroundColor: colors.surfaceElevated },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
```

```tsx
// src/features/home/home.screen.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { createInitialEditState } from '@core/edit-session/edit-state';
import { ErrorBanner, LoadingOverlay } from '@ui/feedback';
import { SafeAreaView } from '@ui/layout';
import { Button, IconButton, Text } from '@ui/primitives';
import { useImportImage } from '@features/import-image';
import { addRecentItem, getRecentItems, saveDraft } from '@services/storage';
import { colors, spacing } from '@theme/tokens';

import { DraftGrid } from './draft-grid';
import { useDrafts } from './use-drafts';

export function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { drafts, isLoading, error, remove } = useDrafts();
  const { isLoading: isPickingImage, error: importError, pickImage } = useImportImage();
  const [recentCount, setRecentCount] = React.useState(0);

  React.useEffect(() => {
    void getRecentItems().then((items) => setRecentCount(items.length));
  }, []);

  const handleAddPhoto = React.useCallback(async () => {
    const asset = await pickImage();
    if (!asset) {
      return;
    }

    const now = Date.now();
    const editState = createInitialEditState(asset.id, asset.uri, asset.width, asset.height);

    await addRecentItem(asset);
    await saveDraft({
      summary: {
        assetId: asset.id,
        assetUri: asset.uri,
        previewUri: asset.uri,
        createdAt: now,
        updatedAt: now,
      },
      history: {
        past: [],
        present: editState,
        future: [],
      },
    });

    router.push(`/editor/${encodeURIComponent(asset.id)}`);
  }, [pickImage, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="heading">Mobilut</Text>
        <IconButton icon="⚙️" accessibilityLabel="Open settings" onPress={() => router.push('/settings')} />
      </View>

      {(error ?? importError) ? <ErrorBanner message={(error ?? importError)?.message ?? 'Unknown error'} /> : null}

      <Button label="Add New Photo" onPress={handleAddPhoto} loading={isPickingImage} />

      {drafts.length > 0 ? (
        <DraftGrid drafts={drafts} onDraftPress={(assetId) => router.push(`/editor/${encodeURIComponent(assetId)}`)} onDeleteDraft={(assetId) => void remove(assetId)} />
      ) : (
        <View style={styles.emptyState}>
          <Text variant="label">NO CONTENT FOUND.</Text>
          <Text variant="caption">Add a photo to start your first draft.</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <Text variant="caption">Collection: {recentCount}</Text>
        <Text variant="caption">Drafts: {drafts.length}</Text>
      </View>

      <LoadingOverlay visible={isLoading} message="Loading drafts…" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyState: {
    gap: spacing.xs,
    borderRadius: 20,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
```

```ts
// src/features/home/index.ts
export { HomeScreen } from './home.screen';
export { DraftGrid } from './draft-grid';
export { useDrafts } from './use-drafts';
```

```tsx
// app/index.tsx
import React from 'react';

import { HomeScreen } from '@features/home';

export default function IndexRoute(): React.JSX.Element {
  return <HomeScreen />;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --runInBand home.screen`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/home app/index.tsx __tests__/features/home.screen.test.tsx

git commit -m "$(cat <<'EOF'
Replace the import-first landing route with a draft-first Home screen

Home becomes the Phase 1 entry point once draft persistence exists. New photos
create an initial draft before we route into the editor, so resume stays reliable.

Constraint: Editor route continues to use /editor/[assetId] only
Rejected: Push raw image metadata through router params | route state would drift from saved draft state
Confidence: high
Scope-risk: moderate
Reversibility: clean
Directive: Keep Add New Photo responsible for creating the initial draft record before navigation
Tested: npm test -- --runInBand home.screen
Not-tested: Real-device image-picker permission denial and long draft lists
EOF
)"
```

---

## Task 3: Hydrate and autosave editor sessions from the draft store

**Files:**
- Modify: `src/features/editor/editor-reducer.ts`
- Modify: `src/features/editor/use-editor-session.ts`
- Test: `__tests__/features/use-editor-session.test.ts`

- [ ] **Step 1: Write the failing hook test**

```ts
// __tests__/features/use-editor-session.test.ts
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useEditorSession } from '@features/editor/use-editor-session';

const loadDraft = jest.fn();
const saveDraft = jest.fn(async () => undefined);

jest.mock('@services/storage', () => ({
  loadDraft,
  saveDraft,
}));

describe('useEditorSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hydrates from a saved draft and autosaves future edits', async () => {
    loadDraft.mockResolvedValue({
      summary: {
        assetId: 'asset-1',
        assetUri: 'file:///draft.jpg',
        previewUri: 'file:///draft.jpg',
        createdAt: 1,
        updatedAt: 2,
      },
      history: {
        past: [],
        present: {
          assetId: 'asset-1',
          assetUri: 'file:///draft.jpg',
          assetWidth: 1200,
          assetHeight: 900,
          selectedPresetId: 'preset-1',
          customLutTable: null,
          adjustments: { intensity: 1, temperature: 0, brightness: 0, contrast: 0, saturation: 0, sharpen: 0 },
          rotation: 0,
          crop: null,
          regionMask: null,
          framing: null,
          watermark: null,
        },
        future: [],
      },
    });

    const { result } = renderHook(() => useEditorSession('asset-1', 'file:///fallback.jpg', 1200, 900));

    await waitFor(() => {
      expect(result.current.editState.selectedPresetId).toBe('preset-1');
    });

    act(() => {
      result.current.dispatch({ type: 'CLEAR_PRESET' });
    });

    await waitFor(() => {
      expect(saveDraft).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand use-editor-session`
Expected: FAIL because drafts are never loaded or saved

- [ ] **Step 3: Add a hydrate action to the reducer**

```ts
// src/features/editor/editor-reducer.ts
import type { DraftRecord } from '@core/draft';

export type EditorAction =
  | { readonly type: 'EDIT'; readonly action: EditAction }
  | { readonly type: 'UNDO' }
  | { readonly type: 'REDO' }
  | { readonly type: 'SET_LOADING'; readonly loading: boolean }
  | { readonly type: 'SET_ERROR'; readonly error: Error | null }
  | { readonly type: 'HYDRATE'; readonly draft: DraftRecord }
  | {
      readonly type: 'RESET';
      readonly assetId: string;
      readonly assetUri: string;
      readonly width: number;
      readonly height: number;
    };

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'HYDRATE':
      return { history: action.draft.history, isLoading: false, error: null };
    // keep the existing switch cases unchanged below this line
  }
}
```

- [ ] **Step 4: Load drafts on mount and autosave after edits**

```ts
// src/features/editor/use-editor-session.ts
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import type { DraftRecord } from '@core/draft';
import type { EditAction } from '@core/edit-session/edit-action';
import { createInitialEditState } from '@core/edit-session/edit-state';
import { canRedo, canUndo } from '@core/edit-session/history';
import { loadDraft, saveDraft } from '@services/storage';

import { editorReducer, type EditorState } from './editor-reducer';

export function useEditorSession(assetId: string, assetUri: string, width: number, height: number) {
  const [state, dispatch] = useReducer(editorReducer, {
    history: {
      past: [],
      present: createInitialEditState(assetId, assetUri, width, height),
      future: [],
    },
    isLoading: true,
    error: null,
  } satisfies EditorState);
  const hasHydrated = useRef(false);
  const createdAtRef = useRef(Date.now());
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void loadDraft(assetId)
      .then((draft) => {
        if (!isMounted) {
          return;
        }
        if (draft) {
          createdAtRef.current = draft.summary.createdAt;
          dispatch({ type: 'HYDRATE', draft });
        } else {
          dispatch({ type: 'SET_LOADING', loading: false });
        }
        hasHydrated.current = true;
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        dispatch({ type: 'SET_LOADING', loading: false });
        dispatch({ type: 'SET_ERROR', error: error instanceof Error ? error : new Error(String(error)) });
        hasHydrated.current = true;
      });

    return () => {
      isMounted = false;
    };
  }, [assetId]);

  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    const draft: DraftRecord = {
      summary: {
        assetId: state.history.present.assetId,
        assetUri: state.history.present.assetUri,
        previewUri: state.history.present.assetUri,
        createdAt: createdAtRef.current,
        updatedAt: Date.now(),
      },
      history: state.history,
    };

    setIsSavingDraft(true);
    void saveDraft(draft)
      .catch((error) => {
        dispatch({ type: 'SET_ERROR', error: error instanceof Error ? error : new Error(String(error)) });
      })
      .finally(() => {
        setIsSavingDraft(false);
      });
  }, [state.history]);

  const dispatchEdit = useCallback((action: EditAction) => {
    dispatch({ type: 'EDIT', action });
  }, []);

  return {
    editState: state.history.present,
    history: state.history,
    isLoading: state.isLoading,
    isSavingDraft,
    error: state.error,
    canUndo: canUndo(state.history),
    canRedo: canRedo(state.history),
    dispatch: dispatchEdit,
    undo: useCallback(() => dispatch({ type: 'UNDO' }), []),
    redo: useCallback(() => dispatch({ type: 'REDO' }), []),
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- --runInBand use-editor-session`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/editor/editor-reducer.ts src/features/editor/use-editor-session.ts __tests__/features/use-editor-session.test.ts

git commit -m "$(cat <<'EOF'
Hydrate editor sessions from saved drafts and autosave subsequent edits

The redesigned Home -> Editor flow only works if the editor can reopen the draft
that Home created and keep writing back to the same record.

Constraint: Editor hydration must keep the existing /editor/[assetId] route contract
Rejected: Add a second draftId route param | unnecessary once draft ids match asset ids
Confidence: high
Scope-risk: moderate
Reversibility: clean
Directive: Keep autosave in the hook, not in the screen component, so future editor shells reuse the same persistence behavior
Tested: npm test -- --runInBand use-editor-session
Not-tested: App background/foreground resume timing on device
EOF
)"
```

---

## Task 4: Refactor the editor into a sheet-based Phase 1 shell

**Files:**
- Create: `src/features/editor/tool-sheet.tsx`
- Create: `src/features/editor/modification-log-sheet.tsx`
- Modify: `src/features/editor/editor.screen.tsx`
- Test: `__tests__/features/editor.screen.test.tsx`

- [ ] **Step 1: Write the failing editor-shell test**

```tsx
// __tests__/features/editor.screen.test.tsx
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { EditorScreen } from '@features/editor';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() }),
}));

jest.mock('@features/editor/use-editor-session', () => ({
  useEditorSession: () => ({
    editState: {
      assetId: 'asset-1',
      assetUri: 'file:///photo.jpg',
      assetWidth: 1200,
      assetHeight: 900,
      selectedPresetId: null,
      customLutTable: null,
      adjustments: { intensity: 1, temperature: 0, brightness: 0, contrast: 0, saturation: 0, sharpen: 0 },
      rotation: 0,
      crop: null,
      regionMask: null,
      framing: null,
      watermark: null,
    },
    history: { past: [], present: null, future: [] },
    isLoading: false,
    isSavingDraft: false,
    error: null,
    canUndo: false,
    canRedo: false,
    dispatch: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
  }),
}));

jest.mock('@features/preset-browser', () => ({
  PresetBrowser: () => 'LUT Browser',
  usePresetBrowser: () => ({
    presets: [],
    categories: ['all'],
    selectedCategory: 'all',
    setSelectedCategory: jest.fn(),
    selectedPresetId: null,
    setSelectedPresetId: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('@features/export-image', () => ({
  ExportImageScreen: () => 'Export Sheet Body',
}));

describe('EditorScreen', () => {
  it('renders the new toolbar and opens bottom sheets', async () => {
    const screen = render(<EditorScreen assetId="asset-1" assetUri="file:///photo.jpg" assetWidth={1200} assetHeight={900} />);

    expect(screen.getByText('Tools')).toBeTruthy();
    expect(screen.getByText('Crop')).toBeTruthy();
    expect(screen.getByText('Adjust')).toBeTruthy();
    expect(screen.getByText('LUT')).toBeTruthy();
    expect(screen.getByText('Log')).toBeTruthy();
    expect(screen.getByText('Export')).toBeTruthy();

    fireEvent.press(screen.getByText('Tools'));

    await waitFor(() => {
      expect(screen.getByText('Border')).toBeTruthy();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand editor.screen`
Expected: FAIL because the current editor still renders inline controls instead of the Phase 1 toolbar/sheets

- [ ] **Step 3: Create the tool sheet and modification-log sheet**

```tsx
// src/features/editor/tool-sheet.tsx
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@ui/layout';
import { Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

export type EditorSheetKey = 'crop' | 'adjust' | 'lut' | 'log' | 'export' | 'frame';

interface ToolSheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelectTool: (sheet: EditorSheetKey) => void;
}

const TOOL_ITEMS: ReadonlyArray<{ key: string; label: string; enabled: boolean; sheet?: EditorSheetKey }> = [
  { key: 'crop', label: 'Crop', enabled: true, sheet: 'crop' },
  { key: 'adjust', label: 'Adjust', enabled: true, sheet: 'adjust' },
  { key: 'lut', label: 'LUT', enabled: true, sheet: 'lut' },
  { key: 'smart', label: 'Smart', enabled: false },
  { key: 'pro', label: 'Pro', enabled: false },
  { key: 'art', label: 'Art', enabled: false },
  { key: 'border', label: 'Border', enabled: true, sheet: 'frame' },
  { key: 'blend', label: 'Blend', enabled: false },
  { key: 'frame', label: 'Frame', enabled: true, sheet: 'frame' },
];

export function ToolSheet({ visible, onClose, onSelectTool }: ToolSheetProps): React.JSX.Element {
  return (
    <BottomSheet visible={visible} title="Tools" onClose={onClose}>
      <View style={styles.grid}>
        {TOOL_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            disabled={!item.enabled || !item.sheet}
            style={[styles.card, !item.enabled && styles.cardDisabled]}
            onPress={() => {
              if (item.sheet) {
                onSelectTool(item.sheet);
              }
            }}
          >
            <Text variant="label">{item.label}</Text>
            {!item.enabled ? <Text variant="caption">Soon</Text> : null}
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    width: '23%',
    minHeight: 84,
    borderRadius: 16,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  cardDisabled: { opacity: 0.5 },
});
```

```tsx
// src/features/editor/modification-log-sheet.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { EditState } from '@core/edit-session/edit-state';
import { BottomSheet } from '@ui/layout';
import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

interface ModificationLogSheetProps {
  readonly visible: boolean;
  readonly snapshots: readonly EditState[];
  readonly onClose: () => void;
}

function describeSnapshot(snapshot: EditState): string {
  if (snapshot.selectedPresetId) {
    return `LUT: ${snapshot.selectedPresetId}`;
  }
  if (snapshot.crop) {
    return 'Crop';
  }
  if (snapshot.rotation !== 0) {
    return `Rotate ${snapshot.rotation}°`;
  }
  if (snapshot.framing) {
    return 'Border / Frame';
  }
  return 'Adjustments';
}

export function ModificationLogSheet({ visible, snapshots, onClose }: ModificationLogSheetProps): React.JSX.Element {
  return (
    <BottomSheet visible={visible} title="Modification Log" onClose={onClose}>
      <View style={styles.list}>
        {snapshots.length === 0 ? (
          <Text variant="caption">No edits committed yet.</Text>
        ) : (
          snapshots.map((snapshot, index) => (
            <View key={`${snapshot.assetId}-${index}`} style={styles.row}>
              <Text variant="label">Step {index + 1}</Text>
              <Text variant="caption">{describeSnapshot(snapshot)}</Text>
            </View>
          ))
        )}
      </View>
      <Button label="Done" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
});
```

- [ ] **Step 4: Replace the inline editor layout with the sheet-based shell**

```tsx
// src/features/editor/editor.screen.tsx
import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

import { PreviewCanvas } from '@adapters/skia/preview-canvas';
import type { AdjustmentParams } from '@core/edit-session/edit-state';
import { ExportImageScreen } from '@features/export-image';
import { FramingPanel } from '@features/framing-toolkit';
import { PresetBrowser, usePresetBrowser } from '@features/preset-browser';
import { BottomSheet, SafeAreaView } from '@ui/layout';
import { Button, IconButton, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

import { AdjustmentPanel } from './components/adjustment-panel';
import { CropOverlay } from './components/crop-overlay';
import { ModificationLogSheet } from './modification-log-sheet';
import { ToolSheet, type EditorSheetKey } from './tool-sheet';
import { useEditorSession } from './use-editor-session';

interface EditorScreenProps {
  readonly assetId: string;
  readonly assetUri?: string;
  readonly assetWidth?: number;
  readonly assetHeight?: number;
}

export function EditorScreen({ assetId, assetUri = '', assetWidth = 1080, assetHeight = 1080 }: EditorScreenProps): React.JSX.Element {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const { editState, history, canUndo, canRedo, undo, redo, dispatch, isLoading, isSavingDraft } = useEditorSession(
    assetId,
    assetUri,
    assetWidth,
    assetHeight,
  );
  const presetBrowser = usePresetBrowser();
  const [activeSheet, setActiveSheet] = React.useState<EditorSheetKey | 'tools' | null>(null);

  const previewWidth = Math.max(240, Math.min(windowWidth - spacing.lg * 2, 420));
  const aspectRatio = editState.assetHeight > 0 ? editState.assetWidth / editState.assetHeight : 1;
  const previewHeight = Math.max(240, Math.round(previewWidth / aspectRatio));

  const handleAdjustmentChange = React.useCallback(
    (adjustments: Partial<AdjustmentParams>) => {
      dispatch({ type: 'SET_ADJUSTMENTS', adjustments });
    },
    [dispatch],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <IconButton icon="✕" accessibilityLabel="Close editor" onPress={() => router.back()} />
        <Text variant="caption">{isSavingDraft ? 'Saving draft…' : 'Draft saved'}</Text>
        <Button label="Export" onPress={() => setActiveSheet('export')} />
      </View>

      <View style={styles.previewArea}>
        {editState.assetUri ? (
          <PreviewCanvas imageUri={editState.assetUri} width={previewWidth} height={previewHeight} />
        ) : (
          <View style={[styles.previewFallback, { width: previewWidth, height: previewHeight }]}>
            <Text variant="caption">Waiting for draft hydration…</Text>
          </View>
        )}
      </View>

      <View style={styles.toolbar}>
        <Button label="Tools" variant="secondary" onPress={() => setActiveSheet('tools')} />
        <Button label="Crop" variant="secondary" onPress={() => setActiveSheet('crop')} />
        <Button label="Adjust" variant="secondary" onPress={() => setActiveSheet('adjust')} />
        <Button label="LUT" variant="secondary" onPress={() => setActiveSheet('lut')} />
        <Button label="Log" variant="secondary" onPress={() => setActiveSheet('log')} />
        <Button label="Undo" variant="secondary" onPress={undo} disabled={!canUndo || isLoading} />
        <Button label="Redo" variant="secondary" onPress={redo} disabled={!canRedo || isLoading} />
      </View>

      <ToolSheet
        visible={activeSheet === 'tools'}
        onClose={() => setActiveSheet(null)}
        onSelectTool={(sheet) => setActiveSheet(sheet)}
      />

      <BottomSheet visible={activeSheet === 'crop'} title="Transform & Crop" onClose={() => setActiveSheet(null)}>
        <CropOverlay crop={editState.crop} onChangeCrop={(crop) => dispatch({ type: 'SET_CROP', crop })} />
        <Button label="Done" onPress={() => setActiveSheet(null)} />
      </BottomSheet>

      <BottomSheet visible={activeSheet === 'adjust'} title="Adjustments" onClose={() => setActiveSheet(null)}>
        <AdjustmentPanel adjustments={editState.adjustments} onChangeAdjustments={handleAdjustmentChange} />
        <Button label="Done" onPress={() => setActiveSheet(null)} />
      </BottomSheet>

      <BottomSheet visible={activeSheet === 'lut'} title="LUT" onClose={() => setActiveSheet(null)}>
        <PresetBrowser
          presets={presetBrowser.presets}
          categories={presetBrowser.categories}
          selectedCategory={presetBrowser.selectedCategory}
          selectedPresetId={presetBrowser.selectedPresetId}
          isLoading={presetBrowser.isLoading}
          onSelectCategory={presetBrowser.setSelectedCategory}
          onSelectPreset={(presetId) => {
            presetBrowser.setSelectedPresetId(presetId);
            dispatch({ type: 'SELECT_PRESET', presetId });
          }}
        />
        <Button label="Done" onPress={() => setActiveSheet(null)} />
      </BottomSheet>

      <BottomSheet visible={activeSheet === 'frame'} title="Border & Frame" onClose={() => setActiveSheet(null)}>
        <FramingPanel framing={editState.framing} dispatch={dispatch} />
        <Button label="Done" onPress={() => setActiveSheet(null)} />
      </BottomSheet>

      <ModificationLogSheet visible={activeSheet === 'log'} snapshots={history.past} onClose={() => setActiveSheet(null)} />

      <BottomSheet visible={activeSheet === 'export'} title="Select Export Format" onClose={() => setActiveSheet(null)}>
        <ExportImageScreen editState={editState} />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, padding: spacing.lg },
  previewArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  previewFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
  },
});
```

- [ ] **Step 5: Run the editor-shell test to verify it passes**

Run: `npm test -- --runInBand editor.screen`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/editor/tool-sheet.tsx src/features/editor/modification-log-sheet.tsx src/features/editor/editor.screen.tsx __tests__/features/editor.screen.test.tsx

git commit -m "$(cat <<'EOF'
Refactor the editor into the sheet-based Phase 1 shell

The redesign keeps the photo as the hero and moves tools into local-feeling
sheets instead of stacking inline controls down the page.

Constraint: Reuse the existing crop/adjust/LUT/export components instead of rebuilding them all at once
Rejected: Keep the current ScrollView layout and add more inline panels | the screen would drift further from the approved interaction model
Confidence: medium
Scope-risk: moderate
Reversibility: clean
Directive: New editor tools should open through the shared sheet state instead of adding more inline sections
Tested: npm test -- --runInBand editor.screen
Not-tested: Gesture feel and sheet animation polish on device
EOF
)"
```

---

## Task 5: Trim Settings to the English-only Phase 1 surface

**Files:**
- Modify: `src/services/storage/app-preferences.ts`
- Modify: `src/i18n/index.ts`
- Modify: `src/features/settings/settings.screen.tsx`
- Test: `__tests__/features/settings.screen.test.tsx`

- [ ] **Step 1: Write the failing Settings test**

```tsx
// __tests__/features/settings.screen.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { SettingsScreen } from '@features/settings';

jest.mock('@services/storage', () => ({
  getPreferences: jest.fn(async () => ({
    language: 'en',
    theme: 'system',
    exportQuality: 'high',
    showWatermark: false,
  })),
  setPreference: jest.fn(async () => undefined),
}));

jest.mock('@i18n', () => ({
  initI18n: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('SettingsScreen', () => {
  it('shows export defaults but no language picker in Phase 1', async () => {
    const screen = render(<SettingsScreen />);

    await waitFor(() => {
      expect(screen.getByText('settings.exportQuality')).toBeTruthy();
    });

    expect(screen.queryByText('English')).toBeNull();
    expect(screen.queryByText('Tiếng Việt')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand settings.screen`
Expected: FAIL because the current screen still renders language chips

- [ ] **Step 3: Update language defaults and remove the picker UI**

```ts
// src/services/storage/app-preferences.ts
const DEFAULT_PREFERENCES: AppPreferences = {
  language: 'en',
  theme: 'system',
  exportQuality: 'high',
  showWatermark: false,
};
```

```ts
// src/i18n/index.ts
export function initI18n(language: 'en' | 'vi' = 'en'): void {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
    return;
  }

  void i18n.changeLanguage(language);
}
```

```tsx
// src/features/settings/settings.screen.tsx
import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getPreferences, setPreference, type AppPreferences } from '@services/storage';
import { Button, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';
import { initI18n } from '@i18n';

const EXPORT_QUALITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
] as const;

export function SettingsScreen(): React.JSX.Element {
  const [preferences, setPreferences] = React.useState<AppPreferences | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    void getPreferences()
      .then((storedPreferences) => {
        if (isMounted) {
          setPreferences(storedPreferences);
          initI18n('en');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const { t } = useTranslation();

  const updatePreference = React.useCallback(async <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
    setIsSaving(true);
    setError(null);
    try {
      await setPreference(key, value);
      setPreferences((current) => (current ? { ...current, [key]: value } : current));
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSaving(false);
    }
  }, []);

  const currentPreferences =
    preferences ??
    ({ language: 'en', theme: 'system', exportQuality: 'high', showWatermark: false } satisfies AppPreferences);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.scrollContent} style={styles.container}>
      <View style={styles.section}>
        <Text variant="heading">{t('settings.title')}</Text>
        <Text variant="body" style={styles.subtitle}>
          Local app preferences for export defaults and watermark behavior.
        </Text>
      </View>

      {error ? (
        <View style={styles.messageCard}>
          <Text variant="label" color={colors.error}>Error</Text>
          <Text variant="body">{error.message}</Text>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text variant="label">{t('settings.exportQuality')}</Text>
        <View style={styles.optionRow}>
          {EXPORT_QUALITY_OPTIONS.map((option) => {
            const isSelected = currentPreferences.exportQuality === option.value;
            return (
              <Button
                key={option.value}
                label={option.label}
                variant={isSelected ? 'primary' : 'secondary'}
                onPress={() => void updatePreference('exportQuality', option.value)}
                disabled={isSaving}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text variant="label">{t('settings.watermark')}</Text>
            <Text variant="caption">Use the saved watermark preference as the default for new exports.</Text>
          </View>
          <Switch disabled={isSaving} value={currentPreferences.showWatermark} onValueChange={(value) => void updatePreference('showWatermark', value)} />
        </View>
      </View>

      <Button label={isSaving ? t('common.loading') : t('common.done')} disabled variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.sm },
  subtitle: { color: colors.secondary },
  sectionCard: { gap: spacing.md, borderRadius: 20, borderCurve: 'continuous', backgroundColor: colors.surface, padding: spacing.md },
  messageCard: { gap: spacing.xs, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.error, padding: spacing.md },
  optionRow: { gap: spacing.sm },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  switchCopy: { flex: 1, gap: spacing.xs },
});
```

- [ ] **Step 4: Run the Settings test to verify it passes**

Run: `npm test -- --runInBand settings.screen`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/storage/app-preferences.ts src/i18n/index.ts src/features/settings/settings.screen.tsx __tests__/features/settings.screen.test.tsx

git commit -m "$(cat <<'EOF'
Trim Settings to the English-only Phase 1 surface

The redesign keeps i18n readiness in the architecture but removes the language
picker from the v1 UI so Settings stays focused and lower-risk.

Constraint: Phase 1 must keep English-only UI without deleting future i18n support
Rejected: Leave the current language chips visible and hide them later | conflicts with the approved v1 scope today
Confidence: high
Scope-risk: narrow
Reversibility: clean
Directive: Keep English as the default initialization language until the product explicitly reintroduces language selection
Tested: npm test -- --runInBand settings.screen
Not-tested: Existing Vietnamese copy consumers outside Settings
EOF
)"
```

---

## Task 6: Final verification

**Files:**
- No new implementation files; verify the complete Phase 1 shell/data slice end-to-end

- [ ] **Step 1: Run focused tests for the new storage + UI surfaces**

Run: `npm test -- --runInBand draft-store home.screen use-editor-session editor.screen settings.screen`
Expected: PASS

- [ ] **Step 2: Run the existing render-parity focused test as a guardrail**

Run: `npm test -- --runInBand preview-render`
Expected: PASS

- [ ] **Step 3: Run lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: PASS

- [ ] **Step 4: Manual QA checklist**

```md
- Launch the app and confirm `app/index.tsx` shows Home, not the import-first screen.
- Tap Add New Photo, pick one image, and verify Home routes to `/editor/[assetId]` with a visible preview instead of the empty placeholder.
- Back out of Editor and confirm the draft now appears under Continue Editing on Home.
- Re-open the same draft and confirm the previous edit state reloads.
- Open Tools, Crop, Adjust, LUT, Log, and Export from the new toolbar and verify each sheet dismisses cleanly.
- Change export quality or watermark defaults in Settings and confirm no language picker is present.
```

- [ ] **Step 5: Final commit**

```bash
git add app/index.tsx src __tests__

git commit -m "$(cat <<'EOF'
Finish the remaining Phase 1 shell work on top of render parity

This closes the gap between the approved redesign and the current repo by
adding draft persistence, a real Home entry point, the sheet-based editor shell,
and the trimmed v1 Settings surface.

Constraint: Phase 2 and Phase 3 stay blocked until the Phase 1 shell/data slice is stable
Rejected: Start Phase 2 stylistic tools before Home/editor/settings are aligned | compounds instability on the wrong foundation
Confidence: medium
Scope-risk: moderate
Reversibility: clean
Directive: Do not start Batch, Blend, or stylistic-tool work until this verification gate is green
Tested: npm test -- --runInBand draft-store home.screen use-editor-session editor.screen settings.screen preview-render; npm run lint; npm run typecheck
Not-tested: Real-device navigation, image-picker, and sheet interaction polish
EOF
)"
```

---

## Completion checklist

- [ ] File-backed draft storage exists and is keyed by `assetId`
- [ ] Home replaces the import-first landing route and creates a draft before navigation
- [ ] Editor hydrates from saved drafts and autosaves edits back to storage
- [ ] Editor uses a Phase 1 top bar + bottom toolbar + bottom sheets instead of inline controls
- [ ] Settings is English-only in the UI while keeping i18n-ready code paths alive
- [ ] Focused tests, render guardrail, lint, and typecheck all pass

**Next after this plan:** refresh Phase 2 implementation against the new Home/editor foundation, then Phase 3 Batch/Blend/Ads.
