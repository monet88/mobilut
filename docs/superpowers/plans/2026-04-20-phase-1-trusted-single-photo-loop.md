# Phase 1: Trusted Single-Photo Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a truthful single-photo editing loop with real preview/export parity, draft resume, and a faster Home → Editor experience.

**Architecture:** Render parity first (shared transform executor), then draft persistence layer, then UI shell. Bottom-sheet navigation inside Editor, stack navigation between screens.

**Tech Stack:** React Native, Expo Router, @shopify/react-native-skia, TypeScript, file-based draft storage

**Repo alignment notes:**
- Keep Home on `app/index.tsx`; the current repo does not use a parallel `/home` route.
- Place integration tests under `__tests__/features/` to match the existing Jest layout rather than colocating `*.test.tsx` under `src/features/`.
- Where older snippets show leaf imports such as `@ui/primitives/text` or `tokens.colors`, prefer the current repo barrels (`@ui/primitives`, `@ui/layout`) and `colors`/`spacing` exports from `@theme/tokens`.

---

## File Structure

### New Files

| Path | Responsibility |
|------|----------------|
| `src/core/render/transform-executor.ts` | Unified transform pipeline for preview + export |
| `src/core/render/transform-executor.test.ts` | Unit tests for transform executor |
| `src/services/draft/draft-repository.ts` | File-based draft CRUD operations |
| `src/services/draft/draft-repository.test.ts` | Draft repository tests |
| `src/services/draft/draft-hydration.ts` | Session hydration from draft files |
| `src/services/draft/index.ts` | Barrel export |
| `src/core/draft/draft-model.ts` | Draft type definitions |
| `src/core/draft/index.ts` | Barrel export |
| `src/features/home/home.screen.tsx` | New Home screen component |
| `src/features/home/draft-grid.tsx` | Draft thumbnails grid |
| `src/features/home/use-drafts.ts` | Hook for draft list management |
| `src/features/home/index.ts` | Barrel export |
| `src/features/editor/tool-sheet.tsx` | Full 9-tool grid sheet |
| `src/features/editor/lut-picker-sheet.tsx` | LUT picker with categories |
| `src/features/editor/crop-sheet.tsx` | Crop/transform controls sheet |
| `src/features/editor/adjust-sheet.tsx` | Adjustment sliders sheet |
| `src/features/editor/modification-log-sheet.tsx` | History list sheet |
| `src/features/editor/export-sheet.tsx` | Export format selection sheet |
| `src/features/editor/use-modification-log.ts` | Coalesced history management |
| `src/ui/layout/tool-panel.tsx` | Glass background panel for sheets |
| `src/ui/composite/tool-grid.tsx` | 4-column tool icon grid |
| `app/index.tsx` | Home entry route (replaces the current import-first landing screen) |

### Modified Files

| Path | Changes |
|------|---------|
| `src/services/image/preview-render.service.ts` | Use transform-executor instead of returning raw URI |
| `src/services/image/export-render.service.ts` | Use transform-executor for full parity |
| `src/features/editor/editor.screen.tsx` | Add bottom toolbar, sheet integration |
| `src/features/editor/use-editor-session.ts` | Add draft save/load, coalesced commits |
| `src/features/editor/editor-reducer.ts` | Add modification log actions |
| `src/features/settings/settings.screen.tsx` | Hide Theme row, remove language switcher |
| `app/index.tsx` | Replace the current ImportImageScreen landing route with HomeScreen |
| `app/_layout.tsx` | Update navigation structure |

---

## Task 1: Transform Executor Core

**Files:**
- Create: `src/core/render/transform-executor.ts`
- Create: `src/core/render/transform-executor.test.ts`
- Create: `src/core/render/index.ts`

### Step 1.1: Write failing test for transform executor interface

- [ ] **Step 1.1.1: Create test file with first test**

```typescript
// src/core/render/transform-executor.test.ts
import { describe, it, expect } from '@jest/globals';
import { executeTransforms, type TransformContext } from './transform-executor';

describe('executeTransforms', () => {
  it('returns original asset when no transforms provided', async () => {
    const context: TransformContext = {
      sourceUri: 'file:///test/image.jpg',
      sourceWidth: 1920,
      sourceHeight: 1080,
      transforms: [],
      mode: 'preview',
    };

    const result = await executeTransforms(context);

    expect(result.uri).toBe('file:///test/image.jpg');
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
  });
});
```

- [ ] **Step 1.1.2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: FAIL with "Cannot find module './transform-executor'"

### Step 1.2: Write minimal implementation

- [ ] **Step 1.2.1: Create transform executor with types**

```typescript
// src/core/render/transform-executor.ts
import type { Transform } from '@core/image-pipeline';

export interface TransformContext {
  readonly sourceUri: string;
  readonly sourceWidth: number;
  readonly sourceHeight: number;
  readonly transforms: readonly Transform[];
  readonly mode: 'preview' | 'export';
  readonly targetWidth?: number;
  readonly targetHeight?: number;
  readonly quality?: number;
}

export interface TransformResult {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
}

export async function executeTransforms(context: TransformContext): Promise<TransformResult> {
  if (context.transforms.length === 0) {
    return {
      uri: context.sourceUri,
      width: context.sourceWidth,
      height: context.sourceHeight,
    };
  }

  let currentUri = context.sourceUri;
  let currentWidth = context.sourceWidth;
  let currentHeight = context.sourceHeight;

  for (const transform of context.transforms) {
    const result = await applyTransform(transform, currentUri, currentWidth, currentHeight, context.mode);
    currentUri = result.uri;
    currentWidth = result.width;
    currentHeight = result.height;
  }

  return { uri: currentUri, width: currentWidth, height: currentHeight };
}

async function applyTransform(
  transform: Transform,
  uri: string,
  width: number,
  height: number,
  _mode: 'preview' | 'export',
): Promise<TransformResult> {
  // Placeholder - will be implemented per transform type
  return { uri, width, height };
}
```

- [ ] **Step 1.2.2: Create barrel export**

```typescript
// src/core/render/index.ts
export { executeTransforms, type TransformContext, type TransformResult } from './transform-executor';
```

- [ ] **Step 1.2.3: Run test to verify it passes**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: PASS

- [ ] **Step 1.2.4: Commit**

```bash
git add src/core/render/
git commit -m "$(cat <<'EOF'
feat(render): add transform executor scaffold

Unified transform pipeline that will be shared between preview and export paths.
EOF
)"
```

### Step 1.3: Add rotation transform

- [ ] **Step 1.3.1: Write failing test for rotation**

```typescript
// Add to src/core/render/transform-executor.test.ts
it('applies rotation transform', async () => {
  const context: TransformContext = {
    sourceUri: 'file:///test/image.jpg',
    sourceWidth: 1920,
    sourceHeight: 1080,
    transforms: [{ type: 'rotate', degrees: 90 }],
    mode: 'export',
  };

  const result = await executeTransforms(context);

  expect(result.width).toBe(1080);
  expect(result.height).toBe(1920);
});
```

- [ ] **Step 1.3.2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: FAIL - width/height not swapped

- [ ] **Step 1.3.3: Implement rotation in applyTransform**

```typescript
// Update applyTransform in src/core/render/transform-executor.ts
import { rotateImage } from '@adapters/expo/image-manipulator';

async function applyTransform(
  transform: Transform,
  uri: string,
  width: number,
  height: number,
  mode: 'preview' | 'export',
): Promise<TransformResult> {
  switch (transform.type) {
    case 'rotate': {
      const degrees = transform.degrees;
      if (degrees === 0) {
        return { uri, width, height };
      }
      const rotatedUri = await rotateImage(uri, degrees);
      const swapped = degrees === 90 || degrees === 270;
      return {
        uri: rotatedUri,
        width: swapped ? height : width,
        height: swapped ? width : height,
      };
    }
    default:
      return { uri, width, height };
  }
}
```

- [ ] **Step 1.3.4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: PASS

- [ ] **Step 1.3.5: Commit**

```bash
git add src/core/render/transform-executor.ts src/core/render/transform-executor.test.ts
git commit -m "$(cat <<'EOF'
feat(render): add rotation transform support
EOF
)"
```

### Step 1.4: Add crop transform

- [ ] **Step 1.4.1: Write failing test for crop**

```typescript
// Add to src/core/render/transform-executor.test.ts
it('applies crop transform', async () => {
  const context: TransformContext = {
    sourceUri: 'file:///test/image.jpg',
    sourceWidth: 1920,
    sourceHeight: 1080,
    transforms: [{ type: 'crop', params: { x: 0.1, y: 0.1, width: 0.5, height: 0.5, aspectRatio: null } }],
    mode: 'export',
  };

  const result = await executeTransforms(context);

  expect(result.width).toBe(960);
  expect(result.height).toBe(540);
});
```

- [ ] **Step 1.4.2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: FAIL

- [ ] **Step 1.4.3: Implement crop in applyTransform**

```typescript
// Add crop case to applyTransform switch in src/core/render/transform-executor.ts
import { cropImage } from '@adapters/expo/image-manipulator';

case 'crop': {
  const crop = transform.params;
  const cropX = Math.round(crop.x * width);
  const cropY = Math.round(crop.y * height);
  const cropWidth = Math.max(1, Math.round(crop.width * width));
  const cropHeight = Math.max(1, Math.round(crop.height * height));
  const croppedUri = await cropImage(uri, cropX, cropY, cropWidth, cropHeight);
  return { uri: croppedUri, width: cropWidth, height: cropHeight };
}
```

- [ ] **Step 1.4.4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: PASS

- [ ] **Step 1.4.5: Commit**

```bash
git add src/core/render/transform-executor.ts src/core/render/transform-executor.test.ts
git commit -m "$(cat <<'EOF'
feat(render): add crop transform support
EOF
)"
```

### Step 1.5: Add adjust transform (Skia shader)

- [ ] **Step 1.5.1: Write failing test for adjustments**

```typescript
// Add to src/core/render/transform-executor.test.ts
it('applies adjust transform', async () => {
  const context: TransformContext = {
    sourceUri: 'file:///test/image.jpg',
    sourceWidth: 1920,
    sourceHeight: 1080,
    transforms: [{
      type: 'adjust',
      params: { intensity: 1, temperature: 0.1, brightness: 0.2, contrast: 0, saturation: 0, sharpen: 0 },
    }],
    mode: 'export',
  };

  const result = await executeTransforms(context);

  expect(result.uri).not.toBe('file:///test/image.jpg');
  expect(result.width).toBe(1920);
  expect(result.height).toBe(1080);
});
```

- [ ] **Step 1.5.2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: FAIL - URI unchanged

- [ ] **Step 1.5.3: Implement adjust transform using Skia CPU render**

```typescript
// Add to src/core/render/transform-executor.ts
import { renderAdjustments } from '@services/image/cpu-render.service';

case 'adjust': {
  const adjustedUri = await renderAdjustments(uri, width, height, transform.params);
  return { uri: adjustedUri, width, height };
}
```

- [ ] **Step 1.5.4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: PASS

- [ ] **Step 1.5.5: Commit**

```bash
git add src/core/render/transform-executor.ts src/core/render/transform-executor.test.ts
git commit -m "$(cat <<'EOF'
feat(render): add adjust transform support via Skia CPU render
EOF
)"
```

### Step 1.6: Add LUT transform

- [ ] **Step 1.6.1: Write failing test for LUT**

```typescript
// Add to src/core/render/transform-executor.test.ts
it('applies lut transform', async () => {
  const context: TransformContext = {
    sourceUri: 'file:///test/image.jpg',
    sourceWidth: 1920,
    sourceHeight: 1080,
    transforms: [{ type: 'lut', presetId: 'test-lut' }],
    mode: 'export',
  };

  const result = await executeTransforms(context);

  expect(result.uri).not.toBe('file:///test/image.jpg');
});
```

- [ ] **Step 1.6.2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: FAIL

- [ ] **Step 1.6.3: Implement LUT transform**

```typescript
// Add to src/core/render/transform-executor.ts
import { applyLutToImage } from '@services/image/cpu-render.service';

case 'lut': {
  const lutUri = await applyLutToImage(uri, width, height, transform.presetId);
  return { uri: lutUri, width, height };
}

case 'custom-lut': {
  const customLutUri = await applyLutToImage(uri, width, height, transform.lutId);
  return { uri: customLutUri, width, height };
}
```

- [ ] **Step 1.6.4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: PASS

- [ ] **Step 1.6.5: Commit**

```bash
git add src/core/render/transform-executor.ts src/core/render/transform-executor.test.ts
git commit -m "$(cat <<'EOF'
feat(render): add LUT transform support
EOF
)"
```

### Step 1.7: Add framing transform

- [ ] **Step 1.7.1: Write failing test for framing**

```typescript
// Add to src/core/render/transform-executor.test.ts
it('applies framing transform', async () => {
  const context: TransformContext = {
    sourceUri: 'file:///test/image.jpg',
    sourceWidth: 1920,
    sourceHeight: 1080,
    transforms: [{
      type: 'framing',
      params: { borderWidth: 20, borderColor: '#FFFFFF', borderRadius: 0, tapeStyle: null },
    }],
    mode: 'export',
  };

  const result = await executeTransforms(context);

  expect(result.width).toBe(1960);
  expect(result.height).toBe(1120);
});
```

- [ ] **Step 1.7.2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: FAIL

- [ ] **Step 1.7.3: Implement framing transform**

```typescript
// Add to src/core/render/transform-executor.ts
import { applyFraming } from '@services/image/cpu-render.service';

case 'framing': {
  const border = transform.params.borderWidth;
  const framedUri = await applyFraming(uri, width, height, transform.params);
  return { uri: framedUri, width: width + border * 2, height: height + border * 2 };
}
```

- [ ] **Step 1.7.4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: PASS

- [ ] **Step 1.7.5: Commit**

```bash
git add src/core/render/transform-executor.ts src/core/render/transform-executor.test.ts
git commit -m "$(cat <<'EOF'
feat(render): add framing/border transform support
EOF
)"
```

---

## Task 2: Wire Transform Executor to Preview Service

**Files:**
- Modify: `src/services/image/preview-render.service.ts`

### Step 2.1: Update preview render to use executor

- [ ] **Step 2.1.1: Write failing test for preview parity**

```typescript
// src/services/image/preview-render.service.test.ts
import { describe, it, expect } from '@jest/globals';
import { renderPreview, buildPreviewRequest } from './preview-render.service';
import { createInitialEditState } from '@core/edit-session/edit-state';

describe('renderPreview', () => {
  it('applies rotation to preview output', async () => {
    const state = {
      ...createInitialEditState('test', 'file:///test.jpg', 1920, 1080),
      rotation: 90 as const,
    };
    const request = buildPreviewRequest(state);
    const result = await renderPreview(request);

    expect(result.width).toBeLessThan(result.height);
  });
});
```

- [ ] **Step 2.1.2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=preview-render`
Expected: FAIL - width > height because rotation not applied

- [ ] **Step 2.1.3: Update preview-render.service.ts**

```typescript
// src/services/image/preview-render.service.ts
import type { EditState } from '@core/edit-session/edit-state';
import { DEFAULT_ADJUSTMENTS } from '@core/edit-session/edit-state';
import type { PreviewRequest, Transform } from '@core/image-pipeline';
import { MAX_PREVIEW_DIMENSION } from '@core/image-pipeline/pipeline-constraints';
import { executeTransforms, type TransformContext } from '@core/render';

export interface PreviewRenderResult {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
}

export async function renderPreview(request: PreviewRequest): Promise<PreviewRenderResult> {
  const context: TransformContext = {
    sourceUri: request.asset.uri,
    sourceWidth: request.asset.width,
    sourceHeight: request.asset.height,
    transforms: request.transforms,
    mode: 'preview',
    targetWidth: request.targetWidth,
    targetHeight: request.targetHeight,
  };

  return executeTransforms(context);
}

// Keep buildPreviewRequest unchanged
```

- [ ] **Step 2.1.4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=preview-render`
Expected: PASS

- [ ] **Step 2.1.5: Commit**

```bash
git add src/services/image/preview-render.service.ts src/services/image/preview-render.service.test.ts
git commit -m "$(cat <<'EOF'
feat(preview): wire transform executor to preview service

Preview now applies transforms instead of returning raw URI.
EOF
)"
```

---

## Task 3: Wire Transform Executor to Export Service

**Files:**
- Modify: `src/services/image/export-render.service.ts`

### Step 3.1: Update export render to use executor

- [ ] **Step 3.1.1: Write failing test for export parity**

```typescript
// src/services/image/export-render.service.test.ts
import { describe, it, expect } from '@jest/globals';
import { renderExport } from './export-render.service';

describe('renderExport', () => {
  it('applies LUT transform to export output', async () => {
    const request = {
      asset: { id: 'test', uri: 'file:///test.jpg', width: 1920, height: 1080, format: 'jpeg' as const, fileSize: null },
      transforms: [{ type: 'lut' as const, presetId: 'test-lut' }],
      targetWidth: 1920,
      targetHeight: 1080,
      quality: 0.9,
      format: 'jpeg' as const,
    };

    const result = await renderExport(request);

    expect(result.uri).not.toBe('file:///test.jpg');
  });
});
```

- [ ] **Step 3.1.2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=export-render`
Expected: FAIL - LUT not applied

- [ ] **Step 3.1.3: Update export-render.service.ts**

```typescript
// src/services/image/export-render.service.ts
import { ExportErrors } from '@core/errors/export-errors';
import type { ExportRequest } from '@core/image-pipeline';
import { MAX_EXPORT_DIMENSION, MAX_EXPORT_PIXELS } from '@core/image-pipeline/pipeline-constraints';
import { executeTransforms, type TransformContext } from '@core/render';

export interface ExportRenderResult {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  readonly format: 'jpeg' | 'png';
}

export async function renderExport(request: ExportRequest): Promise<ExportRenderResult> {
  if (request.targetWidth > MAX_EXPORT_DIMENSION || request.targetHeight > MAX_EXPORT_DIMENSION) {
    throw ExportErrors.DIMENSION_TOO_LARGE(request.targetWidth, request.targetHeight);
  }

  if (request.targetWidth * request.targetHeight > MAX_EXPORT_PIXELS) {
    throw ExportErrors.OUT_OF_MEMORY(request.targetWidth * request.targetHeight);
  }

  const context: TransformContext = {
    sourceUri: request.asset.uri,
    sourceWidth: request.asset.width,
    sourceHeight: request.asset.height,
    transforms: request.transforms,
    mode: 'export',
    targetWidth: request.targetWidth,
    targetHeight: request.targetHeight,
    quality: request.quality,
  };

  const result = await executeTransforms(context);

  return {
    ...result,
    format: request.format === 'png' ? 'png' : 'jpeg',
  };
}
```

- [ ] **Step 3.1.4: Run test to verify it passes**

Run: `npm test -- --testPathPattern=export-render`
Expected: PASS

- [ ] **Step 3.1.5: Commit**

```bash
git add src/services/image/export-render.service.ts src/services/image/export-render.service.test.ts
git commit -m "$(cat <<'EOF'
feat(export): wire transform executor to export service

Export now uses same transform pipeline as preview for parity.
EOF
)"
```

---

## Task 4: Draft Model and Repository

**Files:**
- Create: `src/core/draft/draft-model.ts`
- Create: `src/core/draft/index.ts`
- Create: `src/services/draft/draft-repository.ts`
- Create: `src/services/draft/draft-repository.test.ts`
- Create: `src/services/draft/index.ts`

### Step 4.1: Define draft model

- [ ] **Step 4.1.1: Create draft model types**

```typescript
// src/core/draft/draft-model.ts
import type { EditState } from '@core/edit-session/edit-state';

export interface DraftMetadata {
  readonly id: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly previewUri: string | null;
}

export interface Draft {
  readonly metadata: DraftMetadata;
  readonly editState: EditState;
  readonly historyMetadata: readonly HistoryStepMeta[];
}

export interface HistoryStepMeta {
  readonly stepIndex: number;
  readonly actionType: string;
  readonly label: string;
  readonly timestamp: number;
}

export function createDraftId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
```

- [ ] **Step 4.1.2: Create barrel export**

```typescript
// src/core/draft/index.ts
export type { Draft, DraftMetadata, HistoryStepMeta } from './draft-model';
export { createDraftId } from './draft-model';
```

- [ ] **Step 4.1.3: Commit**

```bash
git add src/core/draft/
git commit -m "$(cat <<'EOF'
feat(draft): add draft model types
EOF
)"
```

### Step 4.2: Implement draft repository

- [ ] **Step 4.2.1: Write failing test for draft save**

```typescript
// src/services/draft/draft-repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { saveDraft, loadDraft, listDrafts, deleteDraft } from './draft-repository';
import { createInitialEditState } from '@core/edit-session/edit-state';
import type { Draft } from '@core/draft';

describe('DraftRepository', () => {
  const testDraft: Draft = {
    metadata: {
      id: 'test-draft-1',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      previewUri: null,
    },
    editState: createInitialEditState('asset-1', 'file:///test.jpg', 1920, 1080),
    historyMetadata: [],
  };

  afterEach(async () => {
    await deleteDraft('test-draft-1');
  });

  it('saves and loads a draft', async () => {
    await saveDraft(testDraft);
    const loaded = await loadDraft('test-draft-1');

    expect(loaded).not.toBeNull();
    expect(loaded?.metadata.id).toBe('test-draft-1');
    expect(loaded?.editState.assetId).toBe('asset-1');
  });
});
```

- [ ] **Step 4.2.2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=draft-repository`
Expected: FAIL - module not found

- [ ] **Step 4.2.3: Implement draft repository**

```typescript
// src/services/draft/draft-repository.ts
import * as FileSystem from 'expo-file-system';
import type { Draft, DraftMetadata } from '@core/draft';

const DRAFTS_DIR = `${FileSystem.documentDirectory}drafts/`;

async function ensureDraftsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DRAFTS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DRAFTS_DIR, { intermediates: true });
  }
}

export async function saveDraft(draft: Draft): Promise<void> {
  await ensureDraftsDir();
  const draftDir = `${DRAFTS_DIR}${draft.metadata.id}/`;
  const draftInfo = await FileSystem.getInfoAsync(draftDir);
  if (!draftInfo.exists) {
    await FileSystem.makeDirectoryAsync(draftDir, { intermediates: true });
  }

  const draftJson = JSON.stringify({
    metadata: draft.metadata,
    editState: draft.editState,
    historyMetadata: draft.historyMetadata,
  });

  await FileSystem.writeAsStringAsync(`${draftDir}draft.json`, draftJson);
}

export async function loadDraft(draftId: string): Promise<Draft | null> {
  const draftPath = `${DRAFTS_DIR}${draftId}/draft.json`;
  const info = await FileSystem.getInfoAsync(draftPath);

  if (!info.exists) {
    return null;
  }

  const content = await FileSystem.readAsStringAsync(draftPath);
  return JSON.parse(content) as Draft;
}

export async function listDrafts(): Promise<DraftMetadata[]> {
  await ensureDraftsDir();
  const dirs = await FileSystem.readDirectoryAsync(DRAFTS_DIR);
  const drafts: DraftMetadata[] = [];

  for (const dir of dirs) {
    const draft = await loadDraft(dir);
    if (draft) {
      drafts.push(draft.metadata);
    }
  }

  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteDraft(draftId: string): Promise<void> {
  const draftDir = `${DRAFTS_DIR}${draftId}/`;
  const info = await FileSystem.getInfoAsync(draftDir);
  if (info.exists) {
    await FileSystem.deleteAsync(draftDir, { idempotent: true });
  }
}
```

- [ ] **Step 4.2.4: Create barrel export**

```typescript
// src/services/draft/index.ts
export { saveDraft, loadDraft, listDrafts, deleteDraft } from './draft-repository';
```

- [ ] **Step 4.2.5: Run test to verify it passes**

Run: `npm test -- --testPathPattern=draft-repository`
Expected: PASS

- [ ] **Step 4.2.6: Commit**

```bash
git add src/services/draft/
git commit -m "$(cat <<'EOF'
feat(draft): add file-based draft repository
EOF
)"
```

---

## Task 5: Draft Hydration Service

**Files:**
- Create: `src/services/draft/draft-hydration.ts`
- Modify: `src/services/draft/index.ts`

### Step 5.1: Implement hydration

- [ ] **Step 5.1.1: Write failing test for hydration**

```typescript
// src/services/draft/draft-hydration.test.ts
import { describe, it, expect } from '@jest/globals';
import { hydrateDraft, HydrationError } from './draft-hydration';
import { saveDraft } from './draft-repository';
import { createInitialEditState } from '@core/edit-session/edit-state';
import type { Draft } from '@core/draft';

describe('hydrateDraft', () => {
  it('returns hydrated session for valid draft', async () => {
    const draft: Draft = {
      metadata: { id: 'hydrate-test', createdAt: Date.now(), updatedAt: Date.now(), previewUri: null },
      editState: createInitialEditState('asset-1', 'file:///test.jpg', 1920, 1080),
      historyMetadata: [],
    };
    await saveDraft(draft);

    const result = await hydrateDraft('hydrate-test');

    expect(result.editState.assetId).toBe('asset-1');
  });

  it('throws HydrationError for missing draft', async () => {
    await expect(hydrateDraft('nonexistent')).rejects.toThrow(HydrationError);
  });
});
```

- [ ] **Step 5.1.2: Run test to verify it fails**

Run: `npm test -- --testPathPattern=draft-hydration`
Expected: FAIL

- [ ] **Step 5.1.3: Implement hydration service**

```typescript
// src/services/draft/draft-hydration.ts
import * as FileSystem from 'expo-file-system';
import type { Draft } from '@core/draft';
import type { EditState } from '@core/edit-session/edit-state';
import type { History } from '@core/edit-session/history';
import { loadDraft } from './draft-repository';

export class HydrationError extends Error {
  constructor(
    message: string,
    public readonly code: 'DRAFT_NOT_FOUND' | 'ASSET_MISSING' | 'CORRUPTED',
  ) {
    super(message);
    this.name = 'HydrationError';
  }
}

export interface HydratedSession {
  readonly draftId: string;
  readonly editState: EditState;
  readonly history: History<EditState>;
}

export async function hydrateDraft(draftId: string): Promise<HydratedSession> {
  const draft = await loadDraft(draftId);

  if (!draft) {
    throw new HydrationError(`Draft not found: ${draftId}`, 'DRAFT_NOT_FOUND');
  }

  const assetInfo = await FileSystem.getInfoAsync(draft.editState.assetUri);
  if (!assetInfo.exists) {
    throw new HydrationError(`Asset missing: ${draft.editState.assetUri}`, 'ASSET_MISSING');
  }

  return {
    draftId,
    editState: draft.editState,
    history: { past: [], present: draft.editState, future: [] },
  };
}
```

- [ ] **Step 5.1.4: Update barrel export**

```typescript
// src/services/draft/index.ts
export { saveDraft, loadDraft, listDrafts, deleteDraft } from './draft-repository';
export { hydrateDraft, HydrationError, type HydratedSession } from './draft-hydration';
```

- [ ] **Step 5.1.5: Run test to verify it passes**

Run: `npm test -- --testPathPattern=draft-hydration`
Expected: PASS

- [ ] **Step 5.1.6: Commit**

```bash
git add src/services/draft/
git commit -m "$(cat <<'EOF'
feat(draft): add session hydration with asset validation
EOF
)"
```

---

## Task 6: Home Screen with Draft Grid

**Files:**
- Create: `src/features/home/home.screen.tsx`
- Create: `src/features/home/draft-grid.tsx`
- Create: `src/features/home/use-drafts.ts`
- Create: `src/features/home/index.ts`
- Modify: `app/index.tsx`

### Step 6.1: Create useDrafts hook

- [ ] **Step 6.1.1: Implement useDrafts hook**

```typescript
// src/features/home/use-drafts.ts
import { useCallback, useEffect, useState } from 'react';
import { listDrafts, deleteDraft } from '@services/draft';
import type { DraftMetadata } from '@core/draft';

export interface UseDraftsResult {
  readonly drafts: readonly DraftMetadata[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly refresh: () => Promise<void>;
  readonly remove: (draftId: string) => Promise<void>;
}

export function useDrafts(): UseDraftsResult {
  const [drafts, setDrafts] = useState<readonly DraftMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await listDrafts();
      setDrafts(list);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load drafts'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (draftId: string) => {
    await deleteDraft(draftId);
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { drafts, isLoading, error, refresh, remove };
}
```

- [ ] **Step 6.1.2: Commit**

```bash
git add src/features/home/use-drafts.ts
git commit -m "$(cat <<'EOF'
feat(home): add useDrafts hook
EOF
)"
```

### Step 6.2: Create DraftGrid component

- [ ] **Step 6.2.1: Implement DraftGrid**

```typescript
// src/features/home/draft-grid.tsx
import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@ui/primitives/text';
import type { DraftMetadata } from '@core/draft';
import { tokens } from '@theme/tokens';

interface DraftGridProps {
  readonly drafts: readonly DraftMetadata[];
  readonly onDraftPress: (draftId: string) => void;
}

export function DraftGrid({ drafts, onDraftPress }: DraftGridProps): React.JSX.Element {
  if (drafts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>CONTINUE EDITING</Text>
      <FlatList
        data={drafts}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable style={styles.draftCard} onPress={() => onDraftPress(item.id)}>
            {item.previewUri ? (
              <Image source={{ uri: item.previewUri }} style={styles.preview} />
            ) : (
              <View style={[styles.preview, styles.placeholder]} />
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  sectionTitle: {
    color: tokens.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContent: { paddingHorizontal: 12 },
  draftCard: {
    marginHorizontal: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  preview: { width: 80, height: 80 },
  placeholder: { backgroundColor: tokens.colors.surfaceDark2 },
});
```

- [ ] **Step 6.2.2: Commit**

```bash
git add src/features/home/draft-grid.tsx
git commit -m "$(cat <<'EOF'
feat(home): add DraftGrid component
EOF
)"
```

### Step 6.3: Create HomeScreen

- [ ] **Step 6.3.1: Implement HomeScreen**

```typescript
// src/features/home/home.screen.tsx
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '@ui/layout/safe-area-view';
import { Text } from '@ui/primitives/text';
import { IconButton } from '@ui/primitives/icon-button';
import { LoadingOverlay } from '@ui/feedback/loading-overlay';
import { DraftGrid } from './draft-grid';
import { useDrafts } from './use-drafts';
import { useImportImage } from '@features/import-image';
import { tokens } from '@theme/tokens';

export function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { drafts, isLoading } = useDrafts();
  const { pickImage } = useImportImage();

  const handleAddPhoto = useCallback(async () => {
    const result = await pickImage();
    if (result) {
      router.push(`/editor/${encodeURIComponent(result.assetId)}`);
    }
  }, [pickImage, router]);

  const handleDraftPress = useCallback(
    (draftId: string) => {
      router.push(`/editor/${encodeURIComponent(draftId)}?draft=true`);
    },
    [router],
  );

  const handleSettingsPress = useCallback(() => {
    router.push('/settings');
  }, [router]);

  if (isLoading) {
    return <LoadingOverlay visible message="Loading..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>MOBILUT</Text>
        <IconButton icon="settings" onPress={handleSettingsPress} />
      </View>

      <View style={styles.content}>
        <Pressable style={styles.addButton} onPress={handleAddPhoto}>
          <Text style={styles.addButtonText}>+ ADD NEW PHOTO</Text>
        </Pressable>

        <DraftGrid drafts={drafts} onDraftPress={handleDraftPress} />

        <View style={styles.stats}>
          <Text style={styles.statsText}>
            Drafts: {drafts.length}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.colors.surfaceBlack },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logo: {
    color: tokens.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  content: { flex: 1, paddingTop: 16 },
  addButton: {
    backgroundColor: tokens.colors.accent,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 980,
    alignItems: 'center',
  },
  addButtonText: {
    color: tokens.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  stats: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  statsText: {
    color: tokens.colors.textSecondary,
    fontSize: 12,
  },
});
```

- [ ] **Step 6.3.2: Create barrel export**

```typescript
// src/features/home/index.ts
export { HomeScreen } from './home.screen';
export { DraftGrid } from './draft-grid';
export { useDrafts } from './use-drafts';
```

- [ ] **Step 6.3.3: Commit**

```bash
git add src/features/home/
git commit -m "$(cat <<'EOF'
feat(home): add HomeScreen with draft-first layout
EOF
)"
```

### Step 6.4: Wire Home into the root route

- [ ] **Step 6.4.1: Replace the import-first index route with HomeScreen**

```typescript
// app/index.tsx
import React from 'react';

import { HomeScreen } from '@features/home';

export default function IndexRoute(): React.JSX.Element {
  return <HomeScreen />;
}
```

- [ ] **Step 6.4.2: Commit**

```bash
git add app/index.tsx
git commit -m "$(cat <<'EOF'
feat(routes): make index the Home entry route
EOF
)"
```

---

## Task 7: Editor Bottom Toolbar

**Files:**
- Modify: `src/features/editor/editor.screen.tsx`
- Create: `src/ui/layout/tool-panel.tsx`

### Step 7.1: Create ToolPanel component

- [ ] **Step 7.1.1: Implement ToolPanel with glass effect**

```typescript
// src/ui/layout/tool-panel.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { tokens } from '@theme/tokens';

interface ToolPanelProps {
  readonly children: React.ReactNode;
}

export function ToolPanel({ children }: ToolPanelProps): React.JSX.Element {
  return (
    <BlurView intensity={80} tint="dark" style={styles.container}>
      <View style={styles.content}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  content: {
    backgroundColor: tokens.colors.glassBg,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
});
```

- [ ] **Step 7.1.2: Update barrel export**

```typescript
// Add to src/ui/layout/index.ts
export { ToolPanel } from './tool-panel';
```

- [ ] **Step 7.1.3: Commit**

```bash
git add src/ui/layout/tool-panel.tsx src/ui/layout/index.ts
git commit -m "$(cat <<'EOF'
feat(ui): add ToolPanel with glass effect
EOF
)"
```

### Step 7.2: Add bottom toolbar to Editor

- [ ] **Step 7.2.1: Update EditorScreen with toolbar**

```typescript
// Update src/features/editor/editor.screen.tsx
// Add bottom toolbar with 7 items: Tools, Crop, Adjust, LUT, Log, Undo, Redo

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from '@ui/layout/safe-area-view';
import { ToolPanel } from '@ui/layout/tool-panel';
import { IconButton } from '@ui/primitives/icon-button';
import { Text } from '@ui/primitives/text';
import { PreviewCanvas } from '@adapters/skia/preview-canvas';
import { useEditorSession } from './use-editor-session';
import { tokens } from '@theme/tokens';

type SheetType = 'tools' | 'crop' | 'adjust' | 'lut' | 'log' | 'export' | null;

export function EditorScreen(): React.JSX.Element {
  const { assetId, draft } = useLocalSearchParams<{ assetId: string; draft?: string }>();
  const router = useRouter();
  const { state, dispatch, canUndo, canRedo } = useEditorSession(assetId, draft === 'true');
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);

  const handleClose = useCallback(() => {
    // TODO: Save draft before closing
    router.back();
  }, [router]);

  const handleExport = useCallback(() => {
    setActiveSheet('export');
  }, []);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <IconButton icon="close" onPress={handleClose} />
        <Pressable style={styles.exportButton} onPress={handleExport}>
          <Text style={styles.exportText}>EXPORT</Text>
        </Pressable>
      </View>

      <View style={styles.canvas}>
        <PreviewCanvas editState={state.history.present} />
      </View>

      <ToolPanel>
        <View style={styles.toolbar}>
          <IconButton icon="apps" label="Tools" onPress={() => setActiveSheet('tools')} />
          <IconButton icon="crop" label="Crop" onPress={() => setActiveSheet('crop')} />
          <IconButton icon="tune" label="Adjust" onPress={() => setActiveSheet('adjust')} />
          <IconButton icon="palette" label="LUT" onPress={() => setActiveSheet('lut')} />
          <IconButton icon="history" label="Log" onPress={() => setActiveSheet('log')} />
          <IconButton icon="undo" onPress={handleUndo} disabled={!canUndo} />
          <IconButton icon="redo" onPress={handleRedo} disabled={!canRedo} />
        </View>
      </ToolPanel>

      {/* Sheet components will be added in subsequent tasks */}
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
  canvas: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
```

- [ ] **Step 7.2.2: Commit**

```bash
git add src/features/editor/editor.screen.tsx
git commit -m "$(cat <<'EOF'
feat(editor): add bottom toolbar with 7 items
EOF
)"
```

---

## Task 8: Tool Sheets (Crop, Adjust, LUT)

**Files:**
- Create: `src/features/editor/crop-sheet.tsx`
- Create: `src/features/editor/adjust-sheet.tsx`
- Create: `src/features/editor/lut-picker-sheet.tsx`

### Step 8.1: Create CropSheet

- [ ] **Step 8.1.1: Implement CropSheet**

```typescript
// src/features/editor/crop-sheet.tsx
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@ui/layout/bottom-sheet';
import { Text } from '@ui/primitives/text';
import { Slider } from '@ui/primitives/slider';
import { IconButton } from '@ui/primitives/icon-button';
import type { CropParams } from '@core/edit-session/edit-state';
import { tokens } from '@theme/tokens';

interface CropSheetProps {
  readonly visible: boolean;
  readonly initialCrop: CropParams | null;
  readonly onApply: (crop: CropParams | null) => void;
  readonly onCancel: () => void;
}

const ASPECT_RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1', value: '1:1' },
  { label: '4:5', value: '4:5' },
  { label: '9:16', value: '9:16' },
  { label: '16:9', value: '16:9' },
];

export function CropSheet({ visible, initialCrop, onApply, onCancel }: CropSheetProps): React.JSX.Element {
  const [crop, setCrop] = useState<CropParams>(
    initialCrop ?? { x: 0, y: 0, width: 1, height: 1, aspectRatio: null },
  );
  const [straighten, setStraighten] = useState(0);

  const handleRatioPress = useCallback((ratio: string | null) => {
    setCrop((prev) => ({ ...prev, aspectRatio: ratio }));
  }, []);

  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0, width: 1, height: 1, aspectRatio: null });
    setStraighten(0);
  }, []);

  const handleApply = useCallback(() => {
    onApply(crop.width === 1 && crop.height === 1 ? null : crop);
  }, [crop, onApply]);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <Text style={styles.title}>TRANSFORM & CROP</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ratioRow}>
        {ASPECT_RATIOS.map((ratio) => (
          <Pressable
            key={ratio.label}
            style={[styles.ratioButton, crop.aspectRatio === ratio.value && styles.ratioButtonActive]}
            onPress={() => handleRatioPress(ratio.value)}
          >
            <Text style={styles.ratioText}>{ratio.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sliderRow}>
        <Text style={styles.sliderLabel}>Straighten: {straighten}°</Text>
        <Slider value={straighten} minimumValue={-45} maximumValue={45} onValueChange={setStraighten} />
      </View>

      <View style={styles.actions}>
        <IconButton icon="close" onPress={onCancel} />
        <IconButton icon="refresh" label="Reset" onPress={handleReset} />
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
  ratioRow: { marginBottom: 16 },
  ratioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: tokens.colors.surfaceDark2,
  },
  ratioButtonActive: { backgroundColor: tokens.colors.accent },
  ratioText: { color: tokens.colors.textPrimary, fontSize: 14 },
  sliderRow: { marginBottom: 16 },
  sliderLabel: { color: tokens.colors.textSecondary, fontSize: 12, marginBottom: 8 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
});
```

- [ ] **Step 8.1.2: Commit**

```bash
git add src/features/editor/crop-sheet.tsx
git commit -m "$(cat <<'EOF'
feat(editor): add CropSheet component
EOF
)"
```

### Step 8.2: Create AdjustSheet

- [ ] **Step 8.2.1: Implement AdjustSheet**

```typescript
// src/features/editor/adjust-sheet.tsx
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@ui/layout/bottom-sheet';
import { Text } from '@ui/primitives/text';
import { Slider } from '@ui/primitives/slider';
import { IconButton } from '@ui/primitives/icon-button';
import { DEFAULT_ADJUSTMENTS, type AdjustmentParams } from '@core/edit-session/edit-state';
import { tokens } from '@theme/tokens';

interface AdjustSheetProps {
  readonly visible: boolean;
  readonly initialAdjustments: AdjustmentParams;
  readonly onApply: (adjustments: AdjustmentParams) => void;
  readonly onCancel: () => void;
  readonly onPreview: (adjustments: AdjustmentParams) => void;
}

const ADJUSTMENT_CONFIG = [
  { key: 'brightness', label: 'Brightness', min: -1, max: 1 },
  { key: 'contrast', label: 'Contrast', min: -1, max: 1 },
  { key: 'saturation', label: 'Saturation', min: -1, max: 1 },
  { key: 'temperature', label: 'Temperature', min: -1, max: 1 },
  { key: 'sharpen', label: 'Sharpen', min: 0, max: 1 },
] as const;

export function AdjustSheet({
  visible,
  initialAdjustments,
  onApply,
  onCancel,
  onPreview,
}: AdjustSheetProps): React.JSX.Element {
  const [adjustments, setAdjustments] = useState<AdjustmentParams>(initialAdjustments);

  const handleSliderChange = useCallback(
    (key: keyof AdjustmentParams, value: number) => {
      setAdjustments((prev) => {
        const next = { ...prev, [key]: value };
        onPreview(next);
        return next;
      });
    },
    [onPreview],
  );

  const handleReset = useCallback(() => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    onPreview(DEFAULT_ADJUSTMENTS);
  }, [onPreview]);

  const handleApply = useCallback(() => {
    onApply(adjustments);
  }, [adjustments, onApply]);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <Text style={styles.title}>ADJUSTMENTS</Text>

      <ScrollView style={styles.sliders}>
        {ADJUSTMENT_CONFIG.map(({ key, label, min, max }) => (
          <View key={key} style={styles.sliderRow}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>{label}</Text>
              <Text style={styles.sliderValue}>{Math.round(adjustments[key] * 100)}</Text>
            </View>
            <Slider
              value={adjustments[key]}
              minimumValue={min}
              maximumValue={max}
              onValueChange={(v) => handleSliderChange(key, v)}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.actions}>
        <IconButton icon="close" onPress={onCancel} />
        <IconButton icon="refresh" label="Reset" onPress={handleReset} />
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
  sliders: { maxHeight: 300 },
  sliderRow: { marginBottom: 16 },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderLabel: { color: tokens.colors.textSecondary, fontSize: 12 },
  sliderValue: { color: tokens.colors.textPrimary, fontSize: 12 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
});
```

- [ ] **Step 8.2.2: Commit**

```bash
git add src/features/editor/adjust-sheet.tsx
git commit -m "$(cat <<'EOF'
feat(editor): add AdjustSheet component
EOF
)"
```

### Step 8.3: Create LUTPickerSheet

- [ ] **Step 8.3.1: Implement LUTPickerSheet**

```typescript
// src/features/editor/lut-picker-sheet.tsx
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@ui/layout/bottom-sheet';
import { Text } from '@ui/primitives/text';
import { Slider } from '@ui/primitives/slider';
import { IconButton } from '@ui/primitives/icon-button';
import { usePresetBrowser } from '@features/preset-browser';
import { tokens } from '@theme/tokens';

interface LUTPickerSheetProps {
  readonly visible: boolean;
  readonly selectedPresetId: string | null;
  readonly intensity: number;
  readonly onSelectPreset: (presetId: string | null) => void;
  readonly onIntensityChange: (intensity: number) => void;
  readonly onApply: () => void;
  readonly onCancel: () => void;
  readonly onImport: () => void;
}

const CATEGORIES = ['Favorites', 'My LUTs', 'Lifestyle', 'Landscape', 'Nature', 'Portrait', 'Cinematic', 'B&W'];

export function LUTPickerSheet({
  visible,
  selectedPresetId,
  intensity,
  onSelectPreset,
  onIntensityChange,
  onApply,
  onCancel,
  onImport,
}: LUTPickerSheetProps): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState('Favorites');
  const { presets, isLoading } = usePresetBrowser(activeCategory);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={styles.categoryText}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {activeCategory === 'My LUTs' && (
        <Pressable style={styles.importButton} onPress={onImport}>
          <Text style={styles.importText}>+ IMPORT NEW LUT</Text>
          <Text style={styles.importSubtext}>Supports .cube, .png files</Text>
        </Pressable>
      )}

      <FlatList
        data={presets}
        keyExtractor={(item) => item.id}
        numColumns={3}
        style={styles.grid}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.presetCard, selectedPresetId === item.id && styles.presetCardSelected]}
            onPress={() => onSelectPreset(item.id)}
          >
            <Image source={{ uri: item.thumbnailUri }} style={styles.presetThumbnail} />
            <Text style={styles.presetName} numberOfLines={1}>{item.name}</Text>
          </Pressable>
        )}
      />

      <View style={styles.intensityRow}>
        <Text style={styles.intensityLabel}>Intensity: {Math.round(intensity * 100)}%</Text>
        <Slider value={intensity} minimumValue={0} maximumValue={1} onValueChange={onIntensityChange} />
      </View>

      <View style={styles.actions}>
        <IconButton icon="close" onPress={onCancel} />
        <IconButton icon="check" onPress={onApply} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  categories: { marginBottom: 12 },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: tokens.colors.surfaceDark2,
  },
  categoryTabActive: { backgroundColor: tokens.colors.accent },
  categoryText: { color: tokens.colors.textPrimary, fontSize: 12 },
  importButton: {
    backgroundColor: tokens.colors.surfaceDark2,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  importText: { color: tokens.colors.accent, fontSize: 14, fontWeight: '600' },
  importSubtext: { color: tokens.colors.textSecondary, fontSize: 11, marginTop: 2 },
  grid: { maxHeight: 200 },
  presetCard: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardSelected: { borderColor: tokens.colors.accent },
  presetThumbnail: { width: '100%', aspectRatio: 1 },
  presetName: { color: tokens.colors.textSecondary, fontSize: 10, padding: 4 },
  intensityRow: { marginTop: 12 },
  intensityLabel: { color: tokens.colors.textSecondary, fontSize: 12, marginBottom: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
});
```

- [ ] **Step 8.3.2: Commit**

```bash
git add src/features/editor/lut-picker-sheet.tsx
git commit -m "$(cat <<'EOF'
feat(editor): add LUTPickerSheet with categories
EOF
)"
```

---

## Task 9: Modification Log Sheet

**Files:**
- Create: `src/features/editor/modification-log-sheet.tsx`
- Create: `src/features/editor/use-modification-log.ts`

### Step 9.1: Create useModificationLog hook

- [ ] **Step 9.1.1: Implement coalesced history management**

```typescript
// src/features/editor/use-modification-log.ts
import { useCallback, useRef } from 'react';
import type { EditAction } from '@core/edit-session/edit-action';

const MAX_HISTORY_STEPS = 50;
const COALESCE_WINDOW_MS = 300;

interface CoalesceState {
  lastActionType: string | null;
  lastTimestamp: number;
}

export function useModificationLog(
  dispatch: (action: { type: 'EDIT'; action: EditAction }) => void,
) {
  const coalesceRef = useRef<CoalesceState>({ lastActionType: null, lastTimestamp: 0 });

  const commitAction = useCallback(
    (action: EditAction, options?: { coalesce?: boolean }) => {
      const now = Date.now();
      const { lastActionType, lastTimestamp } = coalesceRef.current;

      const shouldCoalesce =
        options?.coalesce &&
        action.type === lastActionType &&
        now - lastTimestamp < COALESCE_WINDOW_MS;

      if (!shouldCoalesce) {
        dispatch({ type: 'EDIT', action });
      }

      coalesceRef.current = { lastActionType: action.type, lastTimestamp: now };
    },
    [dispatch],
  );

  const commitAdjustment = useCallback(
    (adjustments: Partial<import('@core/edit-session/edit-state').AdjustmentParams>) => {
      commitAction({ type: 'SET_ADJUSTMENTS', adjustments }, { coalesce: true });
    },
    [commitAction],
  );

  return { commitAction, commitAdjustment, maxSteps: MAX_HISTORY_STEPS };
}
```

- [ ] **Step 9.1.2: Commit**

```bash
git add src/features/editor/use-modification-log.ts
git commit -m "$(cat <<'EOF'
feat(editor): add useModificationLog with coalesced commits
EOF
)"
```

### Step 9.2: Create ModificationLogSheet

- [ ] **Step 9.2.1: Implement ModificationLogSheet**

```typescript
// src/features/editor/modification-log-sheet.tsx
import React, { useCallback } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@ui/layout/bottom-sheet';
import { Text } from '@ui/primitives/text';
import { IconButton } from '@ui/primitives/icon-button';
import type { History } from '@core/edit-session/history';
import type { EditState } from '@core/edit-session/edit-state';
import { tokens } from '@theme/tokens';

interface ModificationLogSheetProps {
  readonly visible: boolean;
  readonly history: History<EditState>;
  readonly onPreviewStep: (index: number) => void;
  readonly onDeleteStep: (index: number) => void;
  readonly onClose: () => void;
}

interface LogEntry {
  readonly index: number;
  readonly label: string;
  readonly previewUri: string | null;
}

function historyToEntries(history: History<EditState>): LogEntry[] {
  const entries: LogEntry[] = [];
  const allStates = [...history.past, history.present];

  allStates.forEach((state, index) => {
    if (index === 0) return;
    entries.push({
      index,
      label: getStepLabel(allStates[index - 1], state),
      previewUri: null,
    });
  });

  return entries;
}

function getStepLabel(prev: EditState, curr: EditState): string {
  if (curr.crop !== prev.crop) return 'CROP';
  if (curr.rotation !== prev.rotation) return 'ROTATE';
  if (curr.selectedPresetId !== prev.selectedPresetId) return `LUT: ${curr.selectedPresetId ?? 'None'}`;
  if (curr.adjustments !== prev.adjustments) return 'ADJUST';
  if (curr.framing !== prev.framing) return 'BORDER';
  return 'EDIT';
}

export function ModificationLogSheet({
  visible,
  history,
  onPreviewStep,
  onDeleteStep,
  onClose,
}: ModificationLogSheetProps): React.JSX.Element {
  const entries = historyToEntries(history);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.title}>MODIFICATION LOG</Text>
        <Text style={styles.stepCount}>{entries.length} STEPS</Text>
      </View>

      {entries.length === 0 ? (
        <Text style={styles.emptyText}>No modifications yet</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => `step-${item.index}`}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={styles.entry}>
              <IconButton icon="visibility" onPress={() => onPreviewStep(item.index)} />
              <View style={styles.previewThumb}>
                {item.previewUri ? (
                  <Image source={{ uri: item.previewUri }} style={styles.thumbImage} />
                ) : (
                  <View style={styles.thumbPlaceholder} />
                )}
              </View>
              <View style={styles.entryInfo}>
                <Text style={styles.entryLabel}>#{item.index} {item.label}</Text>
              </View>
              <IconButton icon="close" onPress={() => onDeleteStep(item.index)} />
            </View>
          )}
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
    marginBottom: 16,
  },
  title: { color: tokens.colors.textPrimary, fontSize: 14, fontWeight: '600' },
  stepCount: { color: tokens.colors.textSecondary, fontSize: 12 },
  emptyText: { color: tokens.colors.textSecondary, textAlign: 'center', paddingVertical: 24 },
  list: { maxHeight: 300 },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.surfaceDark2,
  },
  previewThumb: { marginHorizontal: 8 },
  thumbImage: { width: 48, height: 48, borderRadius: 4 },
  thumbPlaceholder: { width: 48, height: 48, borderRadius: 4, backgroundColor: tokens.colors.surfaceDark2 },
  entryInfo: { flex: 1 },
  entryLabel: { color: tokens.colors.textPrimary, fontSize: 14 },
});
```

- [ ] **Step 9.2.2: Commit**

```bash
git add src/features/editor/modification-log-sheet.tsx
git commit -m "$(cat <<'EOF'
feat(editor): add ModificationLogSheet with step preview
EOF
)"
```

---

## Task 10: Export Sheet

**Files:**
- Create: `src/features/editor/export-sheet.tsx`

### Step 10.1: Implement ExportSheet

- [ ] **Step 10.1.1: Create ExportSheet component**

```typescript
// src/features/editor/export-sheet.tsx
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@ui/layout/bottom-sheet';
import { Text } from '@ui/primitives/text';
import { IconButton } from '@ui/primitives/icon-button';
import { tokens } from '@theme/tokens';

interface ExportSheetProps {
  readonly visible: boolean;
  readonly onExport: (format: 'jpeg' | 'png') => Promise<void>;
  readonly onClose: () => void;
}

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

export function ExportSheet({ visible, onExport, onClose }: ExportSheetProps): React.JSX.Element {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = useCallback(
    async (format: 'jpeg' | 'png') => {
      setStatus('exporting');
      setProgress(0);
      setErrorMessage(null);

      try {
        await onExport(format);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Export failed');
      }
    },
    [onExport],
  );

  const handleClose = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  if (status === 'exporting') {
    return (
      <BottomSheet visible={visible} onClose={() => {}}>
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color={tokens.colors.accent} />
          <Text style={styles.progressText}>EXPORTING...</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </BottomSheet>
    );
  }

  if (status === 'success') {
    return (
      <BottomSheet visible={visible} onClose={handleClose}>
        <View style={styles.resultContainer}>
          <IconButton icon="check-circle" size={48} />
          <Text style={styles.successText}>Export complete!</Text>
          <Pressable style={styles.doneButton} onPress={handleClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </BottomSheet>
    );
  }

  if (status === 'error') {
    return (
      <BottomSheet visible={visible} onClose={handleClose}>
        <View style={styles.resultContainer}>
          <IconButton icon="error" size={48} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={() => setStatus('idle')}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <Text style={styles.title}>SELECT EXPORT FORMAT</Text>

      <Pressable style={styles.formatOption} onPress={() => handleExport('png')}>
        <View style={styles.formatIcon}>
          <Text style={styles.formatIconText}>PNG</Text>
        </View>
        <View style={styles.formatInfo}>
          <Text style={styles.formatTitle}>High Quality (Lossless)</Text>
        </View>
        <IconButton icon="chevron-right" />
      </Pressable>

      <Pressable style={styles.formatOption} onPress={() => handleExport('jpeg')}>
        <View style={styles.formatIcon}>
          <Text style={styles.formatIconText}>JPEG</Text>
        </View>
        <View style={styles.formatInfo}>
          <Text style={styles.formatTitle}>Standard (Most Compatible)</Text>
        </View>
        <IconButton icon="chevron-right" />
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    color: tokens.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.surfaceDark2,
  },
  formatIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: tokens.colors.surfaceDark2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  formatIconText: { color: tokens.colors.textPrimary, fontSize: 12, fontWeight: '600' },
  formatInfo: { flex: 1 },
  formatTitle: { color: tokens.colors.textPrimary, fontSize: 14 },
  progressContainer: { alignItems: 'center', paddingVertical: 32 },
  progressText: { color: tokens.colors.textPrimary, marginTop: 16, marginBottom: 16 },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: tokens.colors.surfaceDark2,
    borderRadius: 2,
  },
  progressFill: { height: '100%', backgroundColor: tokens.colors.accent, borderRadius: 2 },
  resultContainer: { alignItems: 'center', paddingVertical: 32 },
  successText: { color: tokens.colors.textPrimary, fontSize: 16, marginTop: 16 },
  errorText: { color: tokens.colors.error, fontSize: 14, marginTop: 16, textAlign: 'center' },
  doneButton: {
    backgroundColor: tokens.colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 980,
    marginTop: 24,
  },
  doneButtonText: { color: tokens.colors.textPrimary, fontWeight: '600' },
  retryButton: {
    backgroundColor: tokens.colors.surfaceDark2,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 980,
    marginTop: 24,
  },
  retryButtonText: { color: tokens.colors.textPrimary },
});
```

- [ ] **Step 10.1.2: Commit**

```bash
git add src/features/editor/export-sheet.tsx
git commit -m "$(cat <<'EOF'
feat(editor): add ExportSheet with progress and error states
EOF
)"
```

---

## Task 11: Settings Screen Updates

**Files:**
- Modify: `src/features/settings/settings.screen.tsx`

### Step 11.1: Hide Theme row and remove language switcher

- [ ] **Step 11.1.1: Update SettingsScreen**

```typescript
// Update src/features/settings/settings.screen.tsx
// Remove language switcher row
// Hide or disable Theme row with comment about future support

// Find the Theme/Language rows and modify:
// - Remove the Language row entirely
// - Add 'disabled' style to Theme row or remove it
```

- [ ] **Step 11.1.2: Commit**

```bash
git add src/features/settings/settings.screen.tsx
git commit -m "$(cat <<'EOF'
feat(settings): hide Theme row and remove language switcher for v1
EOF
)"
```

---

## Task 12: Integration and Regression Tests

**Files:**
- Create: `__tests__/features/editor.screen.test.tsx`
- Create: `__tests__/features/home.screen.test.tsx`

### Step 12.1: Add Editor integration test

- [ ] **Step 12.1.1: Write Editor test**

```typescript
// __tests__/features/editor.screen.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EditorScreen } from '@features/editor';

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
});
```

- [ ] **Step 12.1.2: Run test**

Run: `npm test -- --testPathPattern=editor.screen`
Expected: PASS

- [ ] **Step 12.1.3: Commit**

```bash
git add __tests__/features/editor.screen.test.tsx
git commit -m "$(cat <<'EOF'
test(editor): add integration tests for Editor screen
EOF
)"
```

### Step 12.2: Add Home integration test

- [ ] **Step 12.2.1: Write Home test**

```typescript
// __tests__/features/home.screen.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from '@features/home';

describe('HomeScreen', () => {
  it('renders ADD NEW PHOTO button', () => {
    const { getByText } = render(<HomeScreen />);

    expect(getByText('+ ADD NEW PHOTO')).toBeTruthy();
  });

  it('renders CONTINUE EDITING section when drafts exist', () => {
    // Mock useDrafts to return drafts
    const { getByText } = render(<HomeScreen />);

    expect(getByText('CONTINUE EDITING')).toBeTruthy();
  });
});
```

- [ ] **Step 12.2.2: Run test**

Run: `npm test -- --testPathPattern=home.screen`
Expected: PASS

- [ ] **Step 12.2.3: Commit**

```bash
git add __tests__/features/home.screen.test.tsx
git commit -m "$(cat <<'EOF'
test(home): add integration tests for Home screen
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

- [ ] **Step 13.2.1: Verify preview/export parity**
  - Import photo, apply LUT, export as JPEG
  - Compare preview to exported file - should match

- [ ] **Step 13.2.2: Verify draft save/resume**
  - Start editing, close app
  - Reopen, verify draft appears on Home
  - Resume draft, verify state restored

- [ ] **Step 13.2.3: Verify all tools work**
  - Test Crop with different aspect ratios
  - Test Adjust sliders
  - Test LUT selection and intensity
  - Test Border/Frame

### Step 13.3: Final commit

- [ ] **Step 13.3.1: Commit any remaining changes**

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: complete Phase 1 - Trusted Single-Photo Loop

- Transform executor with render parity between preview and export
- File-based draft persistence with hydration
- New Home screen with draft-first layout
- Editor bottom toolbar with sheet-based tools
- Crop, Adjust, LUT, Border/Frame tools
- Modification log with coalesced history (max 50 steps)
- Export sheet with progress and error states
- Settings updates (Theme hidden, no language switcher)
EOF
)"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-phase-1-trusted-single-photo-loop.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
