# Phase 1F: Settings + Integration

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Update Settings screen (hide Theme, remove language switcher) and integrate all Phase 1 components with tests.

**Architecture:** Wire all sheets to EditorScreen, add draft auto-save, update Settings.

**Tech Stack:** React Native, Jest, TypeScript

**Estimated context:** ~30K tokens

**Prerequisites:** Phase 1E (Tool Sheets) complete

---

## File Structure

### Modified Files
| Path | Changes |
|------|---------|
| `src/features/settings/settings.screen.tsx` | Hide Theme, remove language |
| `src/features/editor/editor.screen.tsx` | Wire all sheets, auto-save |
| `src/features/editor/use-editor-session.ts` | Add draft save/load |

### New Files
| Path | Responsibility |
|------|----------------|
| `src/features/editor/editor.screen.test.tsx` | Editor integration tests |
| `src/features/home/home.screen.test.tsx` | Home integration tests |

---

## Task 1: Update Settings Screen

**Files:**
- Modify: `src/features/settings/settings.screen.tsx`

### Step 1.1: Hide Theme and remove language switcher

- [ ] **Step 1.1.1: Update SettingsScreen**

```typescript
// src/features/settings/settings.screen.tsx
// Remove the language switcher row
// Hide or disable the Theme row

// Find and remove:
// - Language selection row
// - Language-related state and handlers

// For Theme row, either:
// Option A: Remove it entirely
// Option B: Keep it but disable with a "Coming soon" label

// Example change for Theme row:
<View style={[styles.settingRow, styles.disabled]}>
  <View style={styles.settingIcon}>
    <IconButton icon="palette" disabled />
  </View>
  <View style={styles.settingInfo}>
    <Text style={styles.settingTitle}>Theme</Text>
    <Text style={styles.settingSubtitle}>Dark (Coming soon)</Text>
  </View>
</View>

// Add disabled style:
disabled: {
  opacity: 0.5,
},
```

- [ ] **Step 1.1.2: Commit**

```bash
git add src/features/settings/settings.screen.tsx
git commit -m "feat(settings): hide Theme row and remove language switcher for v1"
```

---

## Task 2: Wire Sheets to Editor

**Files:**
- Modify: `src/features/editor/editor.screen.tsx`

### Step 2.1: Import and integrate all sheets

- [ ] **Step 2.1.1: Update EditorScreen with sheet rendering**

```typescript
// src/features/editor/editor.screen.tsx
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from '@ui/layout/safe-area-view';
import { ToolPanel } from '@ui/layout/tool-panel';
import { IconButton } from '@ui/primitives/icon-button';
import { Text } from '@ui/primitives/text';
import { PreviewCanvas } from '@adapters/skia/preview-canvas';
import { useEditorSession } from './use-editor-session';
import { ToolSheet } from './tool-sheet';
import { CropSheet } from './crop-sheet';
import { AdjustSheet } from './adjust-sheet';
import { LUTPickerSheet } from './lut-picker-sheet';
import { ModificationLogSheet } from './modification-log-sheet';
import { ExportSheet } from './export-sheet';
import { useModificationLog } from './use-modification-log';
import { tokens } from '@theme/tokens';

type SheetType = 
  | 'tools' 
  | 'crop' 
  | 'adjust' 
  | 'lut' 
  | 'log' 
  | 'export' 
  | 'border'
  | 'frame'
  | null;

export function EditorScreen(): React.JSX.Element {
  const { assetId, draft } = useLocalSearchParams<{ 
    assetId: string; 
    draft?: string;
  }>();
  const router = useRouter();
  const { 
    state, 
    dispatch, 
    canUndo, 
    canRedo,
    saveDraft,
    exportImage,
  } = useEditorSession(assetId ?? '', draft === 'true');
  const { commitAction, commitAdjustment } = useModificationLog(dispatch);
  
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [lutIntensity, setLutIntensity] = useState(1);

  const editState = state.history.present;

  const handleClose = useCallback(async () => {
    await saveDraft();
    router.back();
  }, [saveDraft, router]);

  const handleExport = useCallback(async (format: 'jpeg' | 'png') => {
    await exportImage(format);
  }, [exportImage]);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  const handleToolSelect = useCallback((toolId: string) => {
    setActiveSheet(toolId as SheetType);
  }, []);

  const handleCropApply = useCallback((crop: CropParams | null) => {
    if (crop) {
      commitAction({ type: 'SET_CROP', crop });
    } else {
      commitAction({ type: 'CLEAR_CROP' });
    }
    setActiveSheet(null);
  }, [commitAction]);

  const handleAdjustApply = useCallback((adjustments: AdjustmentParams) => {
    commitAction({ type: 'SET_ADJUSTMENTS', adjustments });
    setActiveSheet(null);
  }, [commitAction]);

  const handleAdjustPreview = useCallback((adjustments: AdjustmentParams) => {
    commitAdjustment(adjustments);
  }, [commitAdjustment]);

  const handleLutSelect = useCallback((presetId: string | null) => {
    if (presetId) {
      commitAction({ type: 'SELECT_PRESET', presetId });
    } else {
      commitAction({ type: 'CLEAR_PRESET' });
    }
  }, [commitAction]);

  const handleLutApply = useCallback(() => {
    setActiveSheet(null);
  }, []);

  const closeSheet = useCallback(() => {
    setActiveSheet(null);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <IconButton icon="close" onPress={handleClose} />
        <Pressable 
          style={styles.exportButton} 
          onPress={() => setActiveSheet('export')}
        >
          <Text style={styles.exportText}>EXPORT</Text>
        </Pressable>
      </View>

      {/* Canvas */}
      <View style={styles.canvas}>
        <PreviewCanvas editState={editState} />
      </View>

      {/* Bottom Toolbar */}
      <ToolPanel>
        <View style={styles.toolbar}>
          <IconButton 
            icon="apps" 
            label="Tools" 
            onPress={() => setActiveSheet('tools')} 
          />
          <IconButton 
            icon="crop" 
            label="Crop" 
            onPress={() => setActiveSheet('crop')} 
          />
          <IconButton 
            icon="tune" 
            label="Adjust" 
            onPress={() => setActiveSheet('adjust')} 
          />
          <IconButton 
            icon="palette" 
            label="LUT" 
            onPress={() => setActiveSheet('lut')} 
          />
          <IconButton 
            icon="history" 
            label="Log" 
            onPress={() => setActiveSheet('log')} 
          />
          <IconButton 
            icon="undo" 
            onPress={handleUndo} 
            disabled={!canUndo} 
          />
          <IconButton 
            icon="redo" 
            onPress={handleRedo} 
            disabled={!canRedo} 
          />
        </View>
      </ToolPanel>

      {/* Sheets */}
      <ToolSheet
        visible={activeSheet === 'tools'}
        onToolSelect={handleToolSelect}
        onClose={closeSheet}
      />

      <CropSheet
        visible={activeSheet === 'crop'}
        initialCrop={editState.crop}
        onApply={handleCropApply}
        onCancel={closeSheet}
      />

      <AdjustSheet
        visible={activeSheet === 'adjust'}
        initialAdjustments={editState.adjustments}
        onApply={handleAdjustApply}
        onCancel={closeSheet}
        onPreview={handleAdjustPreview}
      />

      <LUTPickerSheet
        visible={activeSheet === 'lut'}
        selectedPresetId={editState.selectedPresetId}
        intensity={lutIntensity}
        onSelectPreset={handleLutSelect}
        onIntensityChange={setLutIntensity}
        onApply={handleLutApply}
        onCancel={closeSheet}
        onImport={() => {/* TODO: Import flow */}}
      />

      <ModificationLogSheet
        visible={activeSheet === 'log'}
        history={state.history}
        onPreviewStep={(index) => {/* TODO: Preview step */}}
        onDeleteStep={(index) => {/* TODO: Delete step */}}
        onClose={closeSheet}
      />

      <ExportSheet
        visible={activeSheet === 'export'}
        onExport={handleExport}
        onClose={closeSheet}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: tokens.colors.surfaceBlack,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  exportButton: {
    backgroundColor: tokens.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 980,
  },
  exportText: {
    color: tokens.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  canvas: { 
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
```

- [ ] **Step 2.1.2: Commit**

```bash
git add src/features/editor/editor.screen.tsx
git commit -m "feat(editor): wire all Phase 1 sheets to EditorScreen"
```

---

## Task 3: Update useEditorSession

**Files:**
- Modify: `src/features/editor/use-editor-session.ts`

### Step 3.1: Add draft save/load functionality

- [ ] **Step 3.1.1: Update hook**

```typescript
// src/features/editor/use-editor-session.ts
import { useCallback, useEffect, useReducer, useRef } from 'react';
import { editorReducer, type EditorState, type EditorAction } from './editor-reducer';
import { createInitialEditState } from '@core/edit-session/edit-state';
import { 
  saveDraft as saveDraftToRepo, 
  hydrateDraft,
  HydrationError,
} from '@services/draft';
import { createDraftId, createDraftMetadata } from '@core/draft';
import { renderExport, buildExportRequest } from '@services/image/export-render.service';
import { saveToMediaLibrary } from '@adapters/expo/media-library';

interface UseEditorSessionResult {
  readonly state: EditorState;
  readonly dispatch: React.Dispatch<EditorAction>;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly saveDraft: () => Promise<void>;
  readonly exportImage: (format: 'jpeg' | 'png') => Promise<void>;
}

export function useEditorSession(
  assetId: string,
  isDraft: boolean,
): UseEditorSessionResult {
  const draftIdRef = useRef<string | null>(isDraft ? assetId : null);

  const initialState: EditorState = {
    history: {
      past: [],
      present: createInitialEditState(assetId, '', 0, 0),
      future: [],
    },
    isLoading: true,
    error: null,
  };

  const [state, dispatch] = useReducer(editorReducer, initialState);

  // Load draft or create new session
  useEffect(() => {
    const loadSession = async () => {
      dispatch({ type: 'SET_LOADING', loading: true });

      try {
        if (isDraft) {
          const session = await hydrateDraft(assetId);
          draftIdRef.current = session.draftId;
          dispatch({
            type: 'RESET',
            assetId: session.editState.assetId,
            assetUri: session.editState.assetUri,
            width: session.editState.assetWidth,
            height: session.editState.assetHeight,
          });
        } else {
          // New photo - assetId is the asset URI
          // TODO: Get actual dimensions from asset
          dispatch({
            type: 'RESET',
            assetId,
            assetUri: assetId,
            width: 1920,
            height: 1080,
          });
        }
      } catch (error) {
        if (error instanceof HydrationError) {
          dispatch({ type: 'SET_ERROR', error });
        }
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    };

    loadSession();
  }, [assetId, isDraft]);

  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  const saveDraft = useCallback(async () => {
    const editState = state.history.present;
    
    if (!draftIdRef.current) {
      draftIdRef.current = createDraftId();
    }

    await saveDraftToRepo({
      metadata: createDraftMetadata(draftIdRef.current),
      editState,
      historyMetadata: [],
    });
  }, [state.history.present]);

  const exportImage = useCallback(async (format: 'jpeg' | 'png') => {
    const editState = state.history.present;
    const request = buildExportRequest(editState, format);
    const result = await renderExport(request);
    await saveToMediaLibrary(result.uri);
  }, [state.history.present]);

  return {
    state,
    dispatch,
    canUndo,
    canRedo,
    saveDraft,
    exportImage,
  };
}
```

- [ ] **Step 3.1.2: Commit**

```bash
git add src/features/editor/use-editor-session.ts
git commit -m "feat(editor): add draft save/load to useEditorSession"
```

---

## Task 4: Integration Tests

**Files:**
- Create: `src/features/editor/editor.screen.test.tsx`
- Create: `src/features/home/home.screen.test.tsx`

### Step 4.1: Editor integration tests

- [ ] **Step 4.1.1: Create test file**

```typescript
// src/features/editor/editor.screen.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EditorScreen } from './editor.screen';

// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ assetId: 'test-asset' }),
  useRouter: () => ({ back: jest.fn() }),
}));

describe('EditorScreen', () => {
  it('renders bottom toolbar with 7 items', () => {
    const { getByLabelText } = render(<EditorScreen />);

    expect(getByLabelText('Tools')).toBeTruthy();
    expect(getByLabelText('Crop')).toBeTruthy();
    expect(getByLabelText('Adjust')).toBeTruthy();
    expect(getByLabelText('LUT')).toBeTruthy();
    expect(getByLabelText('Log')).toBeTruthy();
  });

  it('opens crop sheet when Crop button pressed', async () => {
    const { getByLabelText, getByText } = render(<EditorScreen />);

    fireEvent.press(getByLabelText('Crop'));

    await waitFor(() => {
      expect(getByText('TRANSFORM & CROP')).toBeTruthy();
    });
  });

  it('opens adjust sheet when Adjust button pressed', async () => {
    const { getByLabelText, getByText } = render(<EditorScreen />);

    fireEvent.press(getByLabelText('Adjust'));

    await waitFor(() => {
      expect(getByText('ADJUSTMENTS')).toBeTruthy();
    });
  });

  it('opens export sheet when Export button pressed', async () => {
    const { getByText } = render(<EditorScreen />);

    fireEvent.press(getByText('EXPORT'));

    await waitFor(() => {
      expect(getByText('SELECT EXPORT FORMAT')).toBeTruthy();
    });
  });

  it('shows undo/redo buttons disabled initially', () => {
    const { getByLabelText } = render(<EditorScreen />);

    const undoButton = getByLabelText('undo');
    const redoButton = getByLabelText('redo');

    expect(undoButton.props.disabled).toBe(true);
    expect(redoButton.props.disabled).toBe(true);
  });
});
```

- [ ] **Step 4.1.2: Run tests**

```bash
npm test -- --testPathPattern=editor.screen
```
Expected: PASS

- [ ] **Step 4.1.3: Commit**

```bash
git add src/features/editor/editor.screen.test.tsx
git commit -m "test(editor): add integration tests"
```

### Step 4.2: Home integration tests

- [ ] **Step 4.2.1: Create test file**

```typescript
// src/features/home/home.screen.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from './home.screen';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({ 
    push: jest.fn(),
  }),
}));

// Mock draft service
jest.mock('@services/draft', () => ({
  listDrafts: jest.fn().mockResolvedValue([]),
  deleteDraft: jest.fn().mockResolvedValue(undefined),
}));

describe('HomeScreen', () => {
  it('renders ADD NEW PHOTO button', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('+ ADD NEW PHOTO')).toBeTruthy();
  });

  it('renders MOBILUT logo', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('MOBILUT')).toBeTruthy();
  });

  it('shows empty state when no drafts', async () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('NO DRAFTS YET')).toBeTruthy();
  });

  it('renders settings button', () => {
    const { getByLabelText } = render(<HomeScreen />);

    expect(getByLabelText('settings')).toBeTruthy();
  });
});
```

- [ ] **Step 4.2.2: Run tests**

```bash
npm test -- --testPathPattern=home.screen
```
Expected: PASS

- [ ] **Step 4.2.3: Commit**

```bash
git add src/features/home/home.screen.test.tsx
git commit -m "test(home): add integration tests"
```

---

## Task 5: Final Verification

### Step 5.1: Run full test suite

- [ ] **Step 5.1.1: Run all tests**

```bash
npm test
```
Expected: All tests pass

### Step 5.2: Manual QA checklist

- [ ] **Step 5.2.1: Verify Home → Editor flow**
  - Open app, lands on Home
  - Tap ADD NEW PHOTO, pick image
  - Editor opens with photo

- [ ] **Step 5.2.2: Verify all tool sheets**
  - Crop sheet opens and applies
  - Adjust sheet with live preview
  - LUT picker selects and applies
  - Modification log shows steps

- [ ] **Step 5.2.3: Verify export**
  - Export as PNG succeeds
  - Export as JPEG succeeds
  - Progress and success states work

- [ ] **Step 5.2.4: Verify draft resume**
  - Edit photo, close editor
  - Draft appears on Home
  - Resume draft restores state

- [ ] **Step 5.2.5: Verify Settings**
  - Settings screen opens
  - No language switcher
  - Theme row hidden/disabled

### Step 5.3: Final commit

- [ ] **Step 5.3.1: Commit**

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: complete Phase 1 - Trusted Single-Photo Loop

- Transform executor with render parity
- File-based draft persistence
- New Home screen with draft-first layout
- Editor bottom toolbar with glass effect
- Crop, Adjust, LUT, Border/Frame tools
- Modification log with coalesced history
- Export sheet with progress states
- Settings updates (Theme hidden, no language)
- Integration tests for Editor and Home
EOF
)"
```

---

## Completion Checklist

- [ ] All Phase 1 tests pass
- [ ] Home → Editor → Export flow works
- [ ] Draft save and resume works
- [ ] Settings updated for v1
- [ ] No regressions in existing features

**Phase 1 Complete!**

**Next:** Phase 2A - Artistic Look
