# Phase 1A: Render Parity

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Create unified transform executor shared between preview and export paths.

**Architecture:** Single `executeTransforms()` function that applies transforms sequentially. Preview and export services both call this.

**Tech Stack:** TypeScript, @shopify/react-native-skia, expo-image-manipulator

**Estimated context:** ~40K tokens

---

## File Structure

### New Files
| Path | Responsibility |
|------|----------------|
| `src/core/render/transform-executor.ts` | Unified transform pipeline |
| `src/core/render/transform-executor.test.ts` | Unit tests |
| `src/core/render/index.ts` | Barrel export |

### Modified Files
| Path | Changes |
|------|---------|
| `src/services/image/preview-render.service.ts` | Use transform executor |
| `src/services/image/export-render.service.ts` | Use transform executor |

---

## Task 1: Transform Executor Scaffold

**Files:**
- Create: `src/core/render/transform-executor.ts`
- Create: `src/core/render/transform-executor.test.ts`
- Create: `src/core/render/index.ts`

### Step 1.1: Write failing test

- [ ] **Step 1.1.1: Create test file**

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

- [ ] **Step 1.1.2: Run test to verify failure**

```bash
npm test -- --testPathPattern=transform-executor
```
Expected: FAIL with "Cannot find module"

### Step 1.2: Create minimal implementation

- [ ] **Step 1.2.1: Create transform executor**

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
  // Will be implemented per transform type
  return { uri, width, height };
}
```

- [ ] **Step 1.2.2: Create barrel export**

```typescript
// src/core/render/index.ts
export { executeTransforms, type TransformContext, type TransformResult } from './transform-executor';
```

- [ ] **Step 1.2.3: Run test**

```bash
npm test -- --testPathPattern=transform-executor
```
Expected: PASS

- [ ] **Step 1.2.4: Commit**

```bash
git add src/core/render/
git commit -m "feat(render): add transform executor scaffold"
```

---

## Task 2: Rotation Transform

### Step 2.1: Add rotation test

- [ ] **Step 2.1.1: Write test**

```typescript
// Add to transform-executor.test.ts
it('applies rotation transform and swaps dimensions for 90/270', async () => {
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

- [ ] **Step 2.1.2: Run test**

```bash
npm test -- --testPathPattern=transform-executor
```
Expected: FAIL

### Step 2.2: Implement rotation

- [ ] **Step 2.2.1: Update applyTransform**

```typescript
// Update applyTransform in transform-executor.ts
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

- [ ] **Step 2.2.2: Run test**

```bash
npm test -- --testPathPattern=transform-executor
```
Expected: PASS

- [ ] **Step 2.2.3: Commit**

```bash
git add src/core/render/transform-executor.ts src/core/render/transform-executor.test.ts
git commit -m "feat(render): add rotation transform"
```

---

## Task 3: Crop Transform

### Step 3.1: Add crop test

- [ ] **Step 3.1.1: Write test**

```typescript
// Add to transform-executor.test.ts
it('applies crop transform', async () => {
  const context: TransformContext = {
    sourceUri: 'file:///test/image.jpg',
    sourceWidth: 1920,
    sourceHeight: 1080,
    transforms: [{ 
      type: 'crop', 
      params: { x: 0.1, y: 0.1, width: 0.5, height: 0.5, aspectRatio: null } 
    }],
    mode: 'export',
  };

  const result = await executeTransforms(context);

  expect(result.width).toBe(960);
  expect(result.height).toBe(540);
});
```

- [ ] **Step 3.1.2: Run test**

```bash
npm test -- --testPathPattern=transform-executor
```
Expected: FAIL

### Step 3.2: Implement crop

- [ ] **Step 3.2.1: Add crop case**

```typescript
// Add to applyTransform switch
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

- [ ] **Step 3.2.2: Run test**

```bash
npm test -- --testPathPattern=transform-executor
```
Expected: PASS

- [ ] **Step 3.2.3: Commit**

```bash
git add src/core/render/transform-executor.ts src/core/render/transform-executor.test.ts
git commit -m "feat(render): add crop transform"
```

---

## Task 4: Adjust, LUT, Framing Transforms

### Step 4.1: Add adjust transform

- [ ] **Step 4.1.1: Write test and implement**

```typescript
// Test
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
});

// Implementation - add to switch
case 'adjust': {
  const adjustedUri = await renderAdjustments(uri, width, height, transform.params);
  return { uri: adjustedUri, width, height };
}
```

- [ ] **Step 4.1.2: Commit**

```bash
git add src/core/render/
git commit -m "feat(render): add adjust transform"
```

### Step 4.2: Add LUT transform

- [ ] **Step 4.2.1: Write test and implement**

```typescript
// Test
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

// Implementation - add to switch
case 'lut': {
  const lutUri = await applyLutToImage(uri, width, height, transform.presetId);
  return { uri: lutUri, width, height };
}

case 'custom-lut': {
  const customLutUri = await applyLutToImage(uri, width, height, transform.lutId);
  return { uri: customLutUri, width, height };
}
```

- [ ] **Step 4.2.2: Commit**

```bash
git add src/core/render/
git commit -m "feat(render): add LUT transform"
```

### Step 4.3: Add framing transform

- [ ] **Step 4.3.1: Write test and implement**

```typescript
// Test
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

// Implementation - add to switch
case 'framing': {
  const border = transform.params.borderWidth;
  const framedUri = await applyFraming(uri, width, height, transform.params);
  return { uri: framedUri, width: width + border * 2, height: height + border * 2 };
}
```

- [ ] **Step 4.3.2: Commit**

```bash
git add src/core/render/
git commit -m "feat(render): add framing transform"
```

---

## Task 5: Wire to Preview Service

**Files:**
- Modify: `src/services/image/preview-render.service.ts`

### Step 5.1: Update preview service

- [ ] **Step 5.1.1: Refactor renderPreview**

```typescript
// src/services/image/preview-render.service.ts
import type { PreviewRequest } from '@core/image-pipeline';
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

- [ ] **Step 5.1.2: Commit**

```bash
git add src/services/image/preview-render.service.ts
git commit -m "feat(preview): use transform executor for render parity"
```

---

## Task 6: Wire to Export Service

**Files:**
- Modify: `src/services/image/export-render.service.ts`

### Step 6.1: Update export service

- [ ] **Step 6.1.1: Refactor renderExport**

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

- [ ] **Step 6.1.2: Commit**

```bash
git add src/services/image/export-render.service.ts
git commit -m "feat(export): use transform executor for render parity"
```

---

## Completion Checklist

- [ ] All tests pass: `npm test -- --testPathPattern=transform-executor`
- [ ] Preview service uses transform executor
- [ ] Export service uses transform executor
- [ ] Transform types supported: rotate, crop, adjust, lut, custom-lut, framing

**Next:** Phase 1B - Draft Persistence
