# Phase 3D: Blend Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single-photo Blend tool with overlay selection, opacity + mode controls, live preview, and export participation.

**Architecture:** `src/core/blend/` owns the pure data model. A small image service wraps overlay selection so feature code never calls Expo APIs directly. Preview uses Skia composition, while the edit session stores one immutable `blend` block that the render pipeline can reuse for preview/export parity.

**Tech Stack:** React Native, `@shopify/react-native-skia`, Expo image picker adapter, TypeScript

**Prerequisites:** Phase 1A/1E/1F and Phase 2D complete.

**Repo alignment notes:**
- Blend extends the sheet-based editor shell introduced in Phase 1D/1E; keep `tool-sheet.tsx` / `blend-sheet.tsx` work inside that future editor surface rather than the current scroll-only shell.
- Keep Blend behavior tests under `__tests__/features/` and pure transform tests beside `src/core/render/` only when they exercise core logic.

---

## File Structure

### New Files

| Path | Responsibility |
|------|----------------|
| `src/core/blend/blend-model.ts` | Blend types, defaults, and guards |
| `src/core/blend/blend-model.test.ts` | Blend model tests |
| `src/core/blend/index.ts` | Blend barrel |
| `src/core/render/blend-transform.ts` | Blend transform helpers for render pipeline |
| `src/core/render/blend-transform.test.ts` | Blend transform tests |
| `src/adapters/skia/blend-shader.ts` | Skia blend-mode mapping |
| `src/services/image/blend-layer.service.ts` | Overlay image selection + normalization |
| `src/features/editor/blend-sheet.tsx` | Blend UI sheet |
| `__tests__/features/blend-sheet.test.tsx` | Blend sheet behavior coverage |

### Modified Files

| Path | Changes |
|------|---------|
| `src/core/edit-session/edit-state.ts` | Add `blend` field to `EditState` |
| `src/core/edit-session/edit-action.ts` | Add blend actions |
| `src/core/image-pipeline/transform.ts` | Add `blend` transform variant |
| `src/features/editor/editor-reducer.ts` | Handle blend actions |
| `src/adapters/skia/preview-canvas.tsx` | Render overlay image with blend mode |
| `src/features/editor/tool-sheet.tsx` | Enable Blend in the 9-tool grid |
| `src/features/editor/editor.screen.tsx` | Present the sheet and dispatch blend updates |
| `src/services/image/index.ts` | Export `pickBlendOverlay` |

---

## Task 1: Blend Domain Model

**Files:**
- Create: `src/core/blend/blend-model.ts`
- Create: `src/core/blend/blend-model.test.ts`
- Create: `src/core/blend/index.ts`

- [ ] **Step 1: Write the failing model test**

```ts
// src/core/blend/blend-model.test.ts
import { describe, expect, it } from '@jest/globals';

import {
  BLEND_MODES,
  clampBlendOpacity,
  createBlendLayer,
  isBlendLayerConfigured,
} from './blend-model';

describe('blend-model', () => {
  it('creates a default overlay layer', () => {
    const blend = createBlendLayer('file:///overlay.png', 2048, 2048);

    expect(blend.overlayUri).toBe('file:///overlay.png');
    expect(blend.mode).toBe('overlay');
    expect(blend.opacity).toBe(0.5);
  });

  it('clamps opacity into the supported range', () => {
    expect(clampBlendOpacity(-1)).toBe(0);
    expect(clampBlendOpacity(1.8)).toBe(1);
    expect(clampBlendOpacity(0.42)).toBe(0.42);
  });

  it('reports whether a blend layer is configured', () => {
    expect(isBlendLayerConfigured(null)).toBe(false);
    expect(isBlendLayerConfigured(createBlendLayer('file:///overlay.png', 100, 200))).toBe(true);
    expect(BLEND_MODES).toContain('screen');
  });
});
```

- [ ] **Step 2: Run the model test to verify it fails**

Run: `npm test -- --runInBand blend-model`
Expected: FAIL with `Cannot find module './blend-model'`

- [ ] **Step 3: Implement the model**

```ts
// src/core/blend/blend-model.ts
export const BLEND_MODES = ['multiply', 'screen', 'overlay', 'softLight'] as const;
export type BlendMode = (typeof BLEND_MODES)[number];

export interface BlendLayer {
  readonly overlayUri: string;
  readonly overlayWidth: number;
  readonly overlayHeight: number;
  readonly opacity: number;
  readonly mode: BlendMode;
}

export function clampBlendOpacity(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function createBlendLayer(
  overlayUri: string,
  overlayWidth: number,
  overlayHeight: number,
  mode: BlendMode = 'overlay',
  opacity: number = 0.5,
): BlendLayer {
  return {
    overlayUri,
    overlayWidth,
    overlayHeight,
    mode,
    opacity: clampBlendOpacity(opacity),
  };
}

export function isBlendLayerConfigured(blend: BlendLayer | null): blend is BlendLayer {
  return Boolean(blend?.overlayUri);
}
```

```ts
// src/core/blend/index.ts
export * from './blend-model';
```

- [ ] **Step 4: Run the model test to verify it passes**

Run: `npm test -- --runInBand blend-model`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/blend

git commit -m "$(cat <<'EOF'
Define a small immutable blend model before touching the editor state tree

The Blend tool needs a single, composable overlay model with a bounded list of
modes and an opacity guard so preview and export can agree on the same payload.

Constraint: EditState must stay renderer-agnostic and immutable
Rejected: Store raw Skia types in EditState | breaks the core/adapters boundary
Confidence: high
Scope-risk: narrow
Reversibility: clean
Directive: Keep blend state to one overlay layer until memory behavior is proven
Tested: npm test -- --runInBand blend-model
Not-tested: Visual output against real overlay assets
EOF
)"
```

---

## Task 2: Blend Transform Helpers and Preview Composition

**Files:**
- Create: `src/core/render/blend-transform.ts`
- Create: `src/core/render/blend-transform.test.ts`
- Create: `src/adapters/skia/blend-shader.ts`
- Modify: `src/adapters/skia/preview-canvas.tsx`

- [ ] **Step 1: Write the failing transform test**

```ts
// src/core/render/blend-transform.test.ts
import { describe, expect, it } from '@jest/globals';

import { createBlendLayer } from '@core/blend';
import { buildBlendTransform, hasBlendTransform } from './blend-transform';

describe('blend-transform', () => {
  it('creates a pipeline transform from a blend layer', () => {
    const blend = createBlendLayer('file:///overlay.png', 1200, 800, 'screen', 0.6);
    const transform = buildBlendTransform(blend);

    expect(transform?.type).toBe('blend');
    expect(transform?.params.mode).toBe('screen');
  });

  it('detects whether a transform array already contains blend data', () => {
    const blend = createBlendLayer('file:///overlay.png', 100, 200);
    expect(hasBlendTransform([buildBlendTransform(blend)!])).toBe(true);
    expect(hasBlendTransform([])).toBe(false);
  });
});
```

- [ ] **Step 2: Run the transform test to verify it fails**

Run: `npm test -- --runInBand blend-transform`
Expected: FAIL with missing module errors for the blend transform helpers

- [ ] **Step 3: Implement the transform helpers and preview canvas support**

```ts
// src/core/render/blend-transform.ts
import type { BlendLayer } from '@core/blend';
import type { Transform } from '@core/image-pipeline';

export function buildBlendTransform(
  blend: BlendLayer | null,
): Extract<Transform, { readonly type: 'blend' }> | null {
  if (!blend) {
    return null;
  }

  return {
    type: 'blend',
    params: blend,
  };
}

export function hasBlendTransform(transforms: readonly Transform[]): boolean {
  return transforms.some((transform) => transform.type === 'blend');
}
```

```ts
// src/adapters/skia/blend-shader.ts
import type { BlendMode } from '@core/blend';

const MODE_MAP: Record<BlendMode, 'multiply' | 'screen' | 'overlay' | 'softLight'> = {
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  softLight: 'softLight',
};

export function toSkiaBlendMode(mode: BlendMode): 'multiply' | 'screen' | 'overlay' | 'softLight' {
  return MODE_MAP[mode];
}
```

```tsx
// src/adapters/skia/preview-canvas.tsx
import React from 'react';
import { Canvas, Group, Image, useImage } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import type { BlendLayer } from '@core/blend';
import { toSkiaBlendMode } from './blend-shader';

interface PreviewCanvasProps {
  readonly imageUri: string;
  readonly width: number;
  readonly height: number;
  readonly blend?: BlendLayer | null;
}

export function PreviewCanvas({ imageUri, width, height, blend = null }: PreviewCanvasProps): React.JSX.Element {
  const image = useImage(imageUri);
  const overlay = useImage(blend?.overlayUri ?? '');

  return (
    <View style={[styles.container, { width, height }]}>
      <Canvas style={{ width, height }}>
        {image ? <Image image={image} x={0} y={0} width={width} height={height} fit="contain" /> : null}
        {image && overlay && blend ? (
          <Group blendMode={toSkiaBlendMode(blend.mode)} opacity={blend.opacity}>
            <Image image={overlay} x={0} y={0} width={width} height={height} fit="cover" />
          </Group>
        ) : null}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
```

- [ ] **Step 4: Run the transform test to verify it passes**

Run: `npm test -- --runInBand blend-transform`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/render/blend-transform.ts src/core/render/blend-transform.test.ts src/adapters/skia/blend-shader.ts src/adapters/skia/preview-canvas.tsx

git commit -m "$(cat <<'EOF'
Teach the preview pipeline how to describe and display blend overlays

Blend should become a normal pipeline transform and a normal preview concern so
live preview can match the editor state instead of shipping a fake sheet-only UI.

Constraint: Preview composition must reuse the existing Skia canvas instead of a second renderer
Rejected: Delay live preview until export support exists | would violate the trusted preview principle
Confidence: medium
Scope-risk: moderate
Reversibility: clean
Directive: Do not widen the supported blend-mode list without manual visual QA
Tested: npm test -- --runInBand blend-transform
Not-tested: Real-device rendering for large overlay images
EOF
)"
```

---

## Task 3: Overlay Selection Service and Edit-State Integration

**Files:**
- Create: `src/services/image/blend-layer.service.ts`
- Modify: `src/services/image/index.ts`
- Modify: `src/core/edit-session/edit-state.ts`
- Modify: `src/core/edit-session/edit-action.ts`
- Modify: `src/core/image-pipeline/transform.ts`
- Modify: `src/features/editor/editor-reducer.ts`

- [ ] **Step 1: Write a failing reducer-level regression test**

```ts
// append to __tests__/features/editor.blend.test.ts or add near reducer coverage
import { createBlendLayer } from '@core/blend';
import type { EditAction } from '@core/edit-session/edit-action';
import { createInitialEditState } from '@core/edit-session/edit-state';

it('stores and clears blend state through edit actions', () => {
  const initial = createInitialEditState('asset-1', 'file:///photo.jpg', 1000, 800);
  const blend = createBlendLayer('file:///overlay.png', 800, 600);

  const setAction: EditAction = { type: 'SET_BLEND', blend };
  const clearAction: EditAction = { type: 'CLEAR_BLEND' };

  const withBlend = applyEditAction(initial, setAction as never);
  const withoutBlend = applyEditAction(withBlend, clearAction as never);

  expect(withBlend.blend?.overlayUri).toBe('file:///overlay.png');
  expect(withoutBlend.blend).toBeNull();
});
```

- [ ] **Step 2: Run the focused editor blend test to verify it fails**

Run: `npm test -- --runInBand editor.blend`
Expected: FAIL because `SET_BLEND` / `CLEAR_BLEND` and `blend` do not exist yet

- [ ] **Step 3: Implement the state + service changes**

```ts
// src/services/image/blend-layer.service.ts
import { pickImageFromLibrary } from '@adapters/expo/image-picker';
import { createBlendLayer, type BlendLayer } from '@core/blend';

export async function pickBlendOverlay(): Promise<BlendLayer | null> {
  const asset = await pickImageFromLibrary();

  if (!asset) {
    return null;
  }

  return createBlendLayer(asset.uri, asset.width, asset.height);
}
```

```ts
// src/services/image/index.ts
export * from './preview-render.service';
export * from './export-render.service';
export * from './cpu-render.service';
export * from './blend-layer.service';
```

```ts
// src/core/edit-session/edit-state.ts
import type { BlendLayer } from '@core/blend';

export interface EditState {
  readonly assetId: string;
  readonly assetUri: string;
  readonly assetWidth: number;
  readonly assetHeight: number;
  readonly selectedPresetId: string | null;
  readonly customLutTable: LutTable | null;
  readonly adjustments: AdjustmentParams;
  readonly rotation: 0 | 90 | 180 | 270;
  readonly crop: CropParams | null;
  readonly regionMask: RegionMask | null;
  readonly framing: FramingParams | null;
  readonly watermark: WatermarkParams | null;
  readonly blend: BlendLayer | null;
}

// inside createInitialEditState(...)
blend: null,
```

```ts
// src/core/edit-session/edit-action.ts
import type { BlendLayer } from '@core/blend';

export type EditAction =
  | { readonly type: 'SELECT_PRESET'; readonly presetId: string }
  | { readonly type: 'CLEAR_PRESET' }
  | { readonly type: 'SET_CUSTOM_LUT'; readonly lut: LutTable }
  | { readonly type: 'CLEAR_CUSTOM_LUT' }
  | { readonly type: 'SET_ADJUSTMENTS'; readonly adjustments: Partial<AdjustmentParams> }
  | { readonly type: 'RESET_ADJUSTMENTS' }
  | { readonly type: 'SET_ROTATION'; readonly rotation: 0 | 90 | 180 | 270 }
  | { readonly type: 'ROTATE_CW' }
  | { readonly type: 'ROTATE_CCW' }
  | { readonly type: 'SET_CROP'; readonly crop: CropParams }
  | { readonly type: 'CLEAR_CROP' }
  | { readonly type: 'SET_REGION_MASK'; readonly mask: RegionMask }
  | { readonly type: 'CLEAR_REGION_MASK' }
  | { readonly type: 'SET_FRAMING'; readonly framing: FramingParams }
  | { readonly type: 'CLEAR_FRAMING' }
  | { readonly type: 'SET_WATERMARK'; readonly watermark: WatermarkParams }
  | { readonly type: 'CLEAR_WATERMARK' }
  | { readonly type: 'SET_BLEND'; readonly blend: BlendLayer }
  | { readonly type: 'CLEAR_BLEND' }
  | { readonly type: 'SET_BLEND_OPACITY'; readonly opacity: number }
  | { readonly type: 'SET_BLEND_MODE'; readonly mode: BlendMode };
```

```ts
// src/core/image-pipeline/transform.ts
import type { BlendLayer } from '@core/blend';

export type Transform =
  | { readonly type: 'lut'; readonly presetId: string }
  | { readonly type: 'custom-lut'; readonly lutId: string }
  | { readonly type: 'adjust'; readonly params: AdjustmentParams }
  | { readonly type: 'rotate'; readonly degrees: 0 | 90 | 180 | 270 }
  | { readonly type: 'crop'; readonly params: CropParams }
  | { readonly type: 'region-mask'; readonly mask: RegionMask }
  | { readonly type: 'framing'; readonly params: FramingParams }
  | { readonly type: 'watermark'; readonly params: WatermarkParams }
  | { readonly type: 'blend'; readonly params: BlendLayer };
```

```ts
// src/features/editor/editor-reducer.ts (inside applyEditAction)
    case 'SET_BLEND':
      return { ...state, blend: action.blend };
    case 'CLEAR_BLEND':
      return { ...state, blend: null };
    case 'SET_BLEND_OPACITY':
      return state.blend ? { ...state, blend: { ...state.blend, opacity: action.opacity } } : state;
    case 'SET_BLEND_MODE':
      return state.blend ? { ...state, blend: { ...state.blend, mode: action.mode } } : state;
```

- [ ] **Step 4: Run the focused editor blend test to verify it passes**

Run: `npm test -- --runInBand editor.blend`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/image/blend-layer.service.ts src/services/image/index.ts src/core/edit-session/edit-state.ts src/core/edit-session/edit-action.ts src/core/image-pipeline/transform.ts src/features/editor/editor-reducer.ts

git commit -m "$(cat <<'EOF'
Store blend overlays in the edit session before shipping the blend sheet

Blend needs a service-backed asset picker and a real slot in EditState so undo,
redo, preview, and export can all reason about the same immutable payload.

Constraint: Feature code must not call Expo pickers directly
Rejected: Keep blend selection as local component state | would break undo/redo and parity
Confidence: high
Scope-risk: moderate
Reversibility: clean
Directive: Any future multi-layer blend work should extend this payload instead of replacing it ad hoc
Tested: npm test -- --runInBand editor.blend
Not-tested: Importing very large overlay files on device
EOF
)"
```

---

## Task 4: Blend Sheet and Editor Wiring

**Files:**
- Create: `src/features/editor/blend-sheet.tsx`
- Test: `__tests__/features/blend-sheet.test.tsx`
- Modify: `src/features/editor/tool-sheet.tsx`
- Modify: `src/features/editor/editor.screen.tsx`

- [ ] **Step 1: Write the failing blend-sheet test**

```tsx
// __tests__/features/blend-sheet.test.tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { BlendSheet } from '@features/editor/blend-sheet';

describe('BlendSheet', () => {
  it('allows importing an overlay and updating opacity + mode', () => {
    const onImport = jest.fn();
    const onClear = jest.fn();
    const onModeChange = jest.fn();
    const onOpacityChange = jest.fn();

    const screen = render(
      <BlendSheet
        visible
        blend={{ overlayUri: 'file:///overlay.png', overlayWidth: 400, overlayHeight: 400, opacity: 0.5, mode: 'overlay' }}
        onClose={jest.fn()}
        onImportOverlay={onImport}
        onClearBlend={onClear}
        onModeChange={onModeChange}
        onOpacityChange={onOpacityChange}
      />,
    );

    fireEvent.press(screen.getByText('Import Overlay'));
    fireEvent.press(screen.getByText('Screen'));
    fireEvent(screen.getByA11yRole('adjustable'), 'onValueChange', 0.8);
    fireEvent.press(screen.getByText('Remove Overlay'));

    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onModeChange).toHaveBeenCalledWith('screen');
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the blend-sheet test to verify it fails**

Run: `npm test -- --runInBand blend-sheet`
Expected: FAIL with missing component error

- [ ] **Step 3: Implement the sheet and editor integration**

```tsx
// src/features/editor/blend-sheet.tsx
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { BlendLayer, BlendMode } from '@core/blend';
import { BLEND_MODES } from '@core/blend';
import { BottomSheet } from '@ui/layout';
import { Button, Slider, Text } from '@ui/primitives';
import { colors, spacing } from '@theme/tokens';

export interface BlendSheetProps {
  readonly visible: boolean;
  readonly blend: BlendLayer | null;
  readonly onClose: () => void;
  readonly onImportOverlay: () => void;
  readonly onClearBlend: () => void;
  readonly onModeChange: (mode: BlendMode) => void;
  readonly onOpacityChange: (opacity: number) => void;
}

export function BlendSheet({
  visible,
  blend,
  onClose,
  onImportOverlay,
  onClearBlend,
  onModeChange,
  onOpacityChange,
}: BlendSheetProps): React.JSX.Element {
  return (
    <BottomSheet visible={visible} title="Blend" onClose={onClose}>
      <Button label="Import Overlay" onPress={onImportOverlay} />

      <View style={styles.modeRow}>
        {BLEND_MODES.map((mode) => {
          const active = blend?.mode === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => onModeChange(mode)}
              style={[styles.modeChip, active ? styles.activeChip : null]}
            >
              <Text selectable={false} variant="label" color={active ? colors.background : colors.primary}>
                {mode === 'softLight' ? 'Soft Light' : `${mode.slice(0, 1).toUpperCase()}${mode.slice(1)}`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Slider
        value={blend?.opacity ?? 0.5}
        minimumValue={0}
        maximumValue={1}
        step={0.05}
        onValueChange={onOpacityChange}
      />

      <Button label="Remove Overlay" variant="secondary" onPress={onClearBlend} disabled={!blend} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  modeChip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderCurve: 'continuous',
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeChip: { backgroundColor: colors.accent },
});
```

```tsx
// src/features/editor/editor.screen.tsx (relevant additions)
import { pickBlendOverlay } from '@services/image';
import { BlendSheet } from './blend-sheet';

const [isBlendSheetVisible, setBlendSheetVisible] = React.useState(false);

const handleImportBlend = React.useCallback(async () => {
  const blend = await pickBlendOverlay();
  if (blend) {
    dispatch({ type: 'SET_BLEND', blend });
  }
}, [dispatch]);

<PreviewCanvas
  imageUri={editState.assetUri}
  width={previewWidth}
  height={previewHeight}
  blend={editState.blend}
/>

<BlendSheet
  visible={isBlendSheetVisible}
  blend={editState.blend}
  onClose={() => setBlendSheetVisible(false)}
  onImportOverlay={() => void handleImportBlend()}
  onClearBlend={() => dispatch({ type: 'CLEAR_BLEND' })}
  onModeChange={(mode) => dispatch({ type: 'SET_BLEND_MODE', mode })}
  onOpacityChange={(opacity) => dispatch({ type: 'SET_BLEND_OPACITY', opacity })}
/>
```

```tsx
// src/features/editor/tool-sheet.tsx (blend item addition)
{
  id: 'blend',
  label: 'Blend',
  icon: '🫧',
  enabled: true,
}
```

- [ ] **Step 4: Run the blend-sheet test to verify it passes**

Run: `npm test -- --runInBand blend-sheet`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/editor/blend-sheet.tsx src/features/editor/editor.screen.tsx src/features/editor/tool-sheet.tsx __tests__/features/blend-sheet.test.tsx

git commit -m "$(cat <<'EOF'
Expose the blend workflow inside the editor once the state and preview paths are ready

Users need a dedicated sheet to import an overlay, choose a blend mode, and tune
opacity without leaving the editor shell or bypassing undo/redo.

Constraint: Tool interactions stay in-editor and bottom-sheet based
Rejected: Put Blend on a separate route | conflicts with the approved editor navigation model
Confidence: medium
Scope-risk: moderate
Reversibility: clean
Directive: Keep Blend out of batch v1 until memory + export behavior are proven
Tested: npm test -- --runInBand blend-sheet
Not-tested: End-to-end preview/export parity for blend overlays
EOF
)"
```

---

## Completion Checklist

- [ ] Blend model is pure and immutable
- [ ] Preview canvas can draw a blend overlay with supported Skia modes
- [ ] Editor state, actions, and reducer store blend data
- [ ] Blend sheet supports import, mode changes, opacity, and clear
- [ ] Blend is enabled in the tool catalog

**Next:** Phase 3E - Home Ads
