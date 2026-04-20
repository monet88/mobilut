# Phase 3F: Integration and Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Phase 3 with focused regression tests, manual QA, and full quality-gate verification across Batch, Blend, and Home ads.

**Architecture:** Keep new test coverage under `__tests__/features/` and `__tests__/services/`, reusing lightweight mocks from `jest.setup.ts` only when multiple suites need them. The final verification pass should prove that Phase 3 additions do not regress the trusted single-photo loop.

**Tech Stack:** Jest, `@testing-library/react-native`, Expo/Jest mocks, existing lint + TypeScript checks

**Prerequisites:** Phase 3A through Phase 3E complete.

---

## File Structure

### New Files

| Path | Responsibility |
|------|----------------|
| `__tests__/features/batch.screen.integration.test.tsx` | Batch screen integration flow |
| `__tests__/features/editor.blend.integration.test.tsx` | Blend tool integration flow |
| `__tests__/features/home.screen.phase3.test.tsx` | Home Phase 3 layout/ads regression |

### Modified Files

| Path | Changes |
|------|---------|
| `jest.setup.ts` | Shared mocks for `react-native-google-mobile-ads`, media library, and Skia preview canvas |

---

## Task 1: Batch Screen Integration Coverage

**Files:**
- Create: `__tests__/features/batch.screen.integration.test.tsx`
- Modify: `jest.setup.ts`

- [ ] **Step 1: Write the failing batch integration test**

```tsx
// __tests__/features/batch.screen.integration.test.tsx
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { BatchScreen } from '@features/batch/batch.screen';
import { createWorkspaceFromAssets, startBatchExport } from '@services/batch';
import { usePresetBrowser } from '@features/preset-browser';

jest.mock('@services/batch', () => ({
  createWorkspaceFromAssets: jest.fn(),
  startBatchExport: jest.fn(() => Promise.resolve({ status: 'completed' })),
  getRecentAssets: jest.fn(() => Promise.resolve([])),
  getAlbums: jest.fn(() => Promise.resolve([])),
  getAlbumAssets: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@features/preset-browser', () => ({
  PresetBrowser: () => null,
  usePresetBrowser: jest.fn(),
}));

const mockedCreateWorkspaceFromAssets = jest.mocked(createWorkspaceFromAssets);
const mockedStartBatchExport = jest.mocked(startBatchExport);
const mockedUsePresetBrowser = jest.mocked(usePresetBrowser);

describe('BatchScreen integration', () => {
  it('creates a workspace, applies a preset, and exports', async () => {
    mockedCreateWorkspaceFromAssets.mockResolvedValue({
      workspace: {
        id: 'workspace-1',
        items: [{ id: 'item-1', assetId: 'asset-1', uri: 'file:///1.jpg', width: 1000, height: 800, filename: '1.jpg', editState: null, status: 'pending', exportedUri: null, error: null }],
        activeItemId: 'item-1',
      },
      skipped: 0,
    } as never);

    mockedUsePresetBrowser.mockReturnValue({
      presets: [{ id: 'preset-1', name: 'LC1', category: 'portrait' }],
      categories: ['all', 'portrait'],
      selectedCategory: 'all',
      setSelectedCategory: jest.fn(),
      selectedPresetId: null,
      setSelectedPresetId: jest.fn(),
      isLoading: false,
    } as never);

    const screen = render(<BatchScreen />);

    await act(async () => {
      fireEvent.press(screen.getByText('Add Photos'));
      screen.rerender(<BatchScreen />);
    });

    await act(async () => {
      await screen.findByText('Apply All');
    });

    fireEvent.press(screen.getByText('Apply All'));
    fireEvent.press(screen.getByText('Export'));

    await waitFor(() => {
      expect(mockedStartBatchExport).toHaveBeenCalledTimes(1);
    });
  });
});
```

- [ ] **Step 2: Run the batch integration test to verify it fails**

Run: `npm test -- --runInBand batch.screen.integration`
Expected: FAIL until the Phase 3C session/screen contract is complete and the shared mocks exist

- [ ] **Step 3: Add the shared Jest mocks and stabilize the test**

```ts
// jest.setup.ts
jest.mock('@adapters/skia/preview-canvas', () => ({
  PreviewCanvas: ({ imageUri }: { imageUri: string }) => imageUri,
}));

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
  })),
  BannerAd: () => null,
  BannerAdSize: {
    ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  },
  TestIds: {
    BANNER: 'test-banner-id',
  },
}));
```

- [ ] **Step 4: Run the batch integration test to verify it passes**

Run: `npm test -- --runInBand batch.screen.integration`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add jest.setup.ts __tests__/features/batch.screen.integration.test.tsx

git commit -m "$(cat <<'EOF'
Lock the batch screen workflow before declaring Phase 3 feature-complete

The batch route now spans picker, workspace, preset application, and export.
One focused integration suite keeps those seams from drifting apart silently.

Constraint: New Phase 3 tests must stay lightweight enough for the normal Jest loop
Rejected: Rely on manual QA only | too risky for a multi-surface flow with async services
Confidence: medium
Scope-risk: moderate
Reversibility: clean
Directive: Add new batch regressions here before widening the mock surface globally
Tested: npm test -- --runInBand batch.screen.integration
Not-tested: Full device media-library permissions and real export I/O
EOF
)"
```

---

## Task 2: Blend Integration Coverage

**Files:**
- Create: `__tests__/features/editor.blend.integration.test.tsx`

- [ ] **Step 1: Write the failing blend integration test**

```tsx
// __tests__/features/editor.blend.integration.test.tsx
import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import { EditorScreen } from '@features/editor';
import { pickBlendOverlay } from '@services/image';

jest.mock('@services/image', () => ({
  ...jest.requireActual('@services/image'),
  pickBlendOverlay: jest.fn(),
}));

const mockedPickBlendOverlay = jest.mocked(pickBlendOverlay);

describe('Editor blend integration', () => {
  it('imports an overlay and updates opacity from the blend sheet', async () => {
    mockedPickBlendOverlay.mockResolvedValue({
      overlayUri: 'file:///overlay.png',
      overlayWidth: 800,
      overlayHeight: 600,
      mode: 'overlay',
      opacity: 0.5,
    } as never);

    const screen = render(
      <EditorScreen assetId="asset-1" assetUri="file:///photo.jpg" assetWidth={1200} assetHeight={900} />,
    );

    fireEvent.press(screen.getByText('Blend'));
    fireEvent.press(screen.getByText('Import Overlay'));

    await waitFor(() => {
      expect(mockedPickBlendOverlay).toHaveBeenCalledTimes(1);
    });
  });
});
```

- [ ] **Step 2: Run the blend integration test to verify it fails**

Run: `npm test -- --runInBand editor.blend.integration`
Expected: FAIL until the Blend tool is wired into `EditorScreen`

- [ ] **Step 3: Verify and adjust the editor-facing labels/accessibility**

```tsx
// src/features/editor/tool-sheet.tsx (ensure the label is stable for tests + users)
{
  id: 'blend',
  label: 'Blend',
  icon: '🫧',
  enabled: true,
}

// src/features/editor/blend-sheet.tsx (button labels used by both UX and tests)
<Button label="Import Overlay" onPress={onImportOverlay} />
<Button label="Remove Overlay" variant="secondary" onPress={onClearBlend} disabled={!blend} />
```

- [ ] **Step 4: Run the blend integration test to verify it passes**

Run: `npm test -- --runInBand editor.blend.integration`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add __tests__/features/editor.blend.integration.test.tsx src/features/editor/tool-sheet.tsx src/features/editor/blend-sheet.tsx

git commit -m "$(cat <<'EOF'
Guard the new blend workflow with one editor-level integration test

Blend touches the tool grid, the bottom sheet, the image service, and preview
state. One editor-focused integration path keeps those pieces aligned.

Constraint: Blend remains a single-photo editor feature, not a batch capability
Rejected: Test reducer logic only | would miss tool-grid and sheet wiring regressions
Confidence: medium
Scope-risk: moderate
Reversibility: clean
Directive: Keep the public button labels stable unless tests and copy are updated together
Tested: npm test -- --runInBand editor.blend.integration
Not-tested: Export parity for blend overlays at full resolution
EOF
)"
```

---

## Task 3: Home Phase 3 Regression Coverage

**Files:**
- Create: `__tests__/features/home.screen.phase3.test.tsx`

- [ ] **Step 1: Write the failing Home regression test**

```tsx
// __tests__/features/home.screen.phase3.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';

import { HomeScreen } from '@features/home/home.screen';

jest.mock('@features/home/home-ad-banner', () => ({
  HomeAdBanner: () => 'Sponsored',
}));

describe('HomeScreen phase 3 regression', () => {
  it('keeps Add New Photo above Batch and Sponsored sections', () => {
    const screen = render(<HomeScreen />);

    const addNewPhoto = screen.getByText('Add New Photo');
    const batch = screen.getByText('Batch');
    const sponsored = screen.getByText('Sponsored');

    expect(addNewPhoto).toBeTruthy();
    expect(batch).toBeTruthy();
    expect(sponsored).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the Home regression test to verify it fails**

Run: `npm test -- --runInBand home.screen.phase3`
Expected: FAIL until Home renders the Phase 3 additions with stable labels

- [ ] **Step 3: Make the Home labels explicit and stable**

```tsx
// src/features/home/home.screen.tsx (relevant label assertions)
<Button label="Add New Photo" onPress={handleAddPhoto} />
<Button label="Batch" variant="secondary" onPress={() => router.push('/batch')} />
<HomeAdBanner />
```

- [ ] **Step 4: Run the Home regression test to verify it passes**

Run: `npm test -- --runInBand home.screen.phase3`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add __tests__/features/home.screen.phase3.test.tsx src/features/home/home.screen.tsx

git commit -m "$(cat <<'EOF'
Freeze Home's Phase 3 hierarchy before shipping batch and ad additions

Home stays trustworthy only if the primary create/resume action remains clearer
than the new batch entry and the optional banner ad.

Constraint: Home remains action-first even after Phase 3 additions
Rejected: Depend on screenshot review alone | misses structural regressions in labels and ordering
Confidence: medium
Scope-risk: narrow
Reversibility: clean
Directive: If Home gets redesigned later, keep a regression test for action hierarchy
Tested: npm test -- --runInBand home.screen.phase3
Not-tested: Small-screen layout compression and live ad heights
EOF
)"
```

---

## Task 4: Full Verification and Final Phase Commit

**Files:**
- No new files; verify the completed Phase 3 surface end-to-end

- [ ] **Step 1: Run the focused Phase 3 test suites**

Run: `npm test -- --runInBand batch.screen.integration editor.blend.integration home.screen.phase3 ad-manager home-ad-banner`
Expected: PASS

- [ ] **Step 2: Run lint and typecheck**

Run: `npm run lint && npm run typecheck`
Expected: PASS

- [ ] **Step 3: Run the broader Jest suite**

Run: `npm test -- --runInBand`
Expected: PASS

- [ ] **Step 4: Manual QA checklist**

```md
- Open Home and confirm `Add New Photo` remains the first clear action.
- Open Batch from Home and build a workspace with 1, 5, and 20 photos.
- Apply one preset + intensity to all items and verify the active preview changes.
- Start batch export and verify the screen remains responsive if one item fails.
- Open Blend in Editor, import an overlay, change mode + opacity, undo, redo, and export.
- Force a banner-ad load failure (test unit / offline simulator) and confirm Home still works with no crash or blocking placeholder.
```

- [ ] **Step 5: Final commit**

```bash
git add jest.setup.ts __tests__/features __tests__/services
git commit -m "$(cat <<'EOF'
Prove Phase 3 is stable before merging batch, blend, and home-ad work

Phase 3 widens the app into new memory, rendering, and monetization paths.
The final gate must combine focused integration tests with full repo checks.

Constraint: Do not declare Phase 3 done without lint, typecheck, and full Jest evidence
Rejected: Merge after only the new suites pass | too easy to miss regressions in the trusted single-photo loop
Confidence: high
Scope-risk: moderate
Reversibility: clean
Directive: Re-run this full gate whenever Batch, Blend, or Home ad wiring changes
Tested: npm test -- --runInBand batch.screen.integration editor.blend.integration home.screen.phase3 ad-manager home-ad-banner; npm run lint; npm run typecheck; npm test -- --runInBand
Not-tested: Device-only performance, memory, and store-review behavior
EOF
)"
```

---

## Completion Checklist

- [ ] Batch route has integration coverage
- [ ] Blend workflow has editor-level integration coverage
- [ ] Home Phase 3 hierarchy and banner fallback have regression coverage
- [ ] Lint, typecheck, focused suites, and full Jest suite pass
- [ ] Manual QA evidence captured

**Next:** Phase 3 complete.
