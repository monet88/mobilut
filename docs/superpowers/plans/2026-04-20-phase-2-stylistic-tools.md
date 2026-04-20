# Phase 2: Stylistic Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add curated style tools (Artistic Look, Smart Filter, Pro Clarity) on top of the trusted Phase 1 editing loop.

**Architecture:** Each tool extends the transform executor with deterministic algorithms. No AI/ML inference - all processing is local and predictable.

**Tech Stack:** React Native, @shopify/react-native-skia shaders, TypeScript

**Prerequisites:** Phase 1 must be complete - render parity, draft persistence, and editor shell must be working.

**Repo alignment notes:**
- Extend the existing `src/features/editor`, `src/core/edit-session`, `src/features/preset-browser`, and `src/services/image` surfaces; do not create a parallel editor stack.
- Keep new editor-facing integration tests under `__tests__/features/` to match the current Jest layout.

---

## File Structure

### New Files

| Path | Responsibility |
|------|----------------|
| `src/core/render/artistic-look-transform.ts` | Preset style family renderer |
| `src/core/render/smart-filter-transform.ts` | Deterministic auto-enhance algorithm |
| `src/core/render/pro-clarity-transform.ts` | Clarity/sharpening stack |
| `src/core/stylistic/artistic-look-model.ts` | Artistic Look presets and params |
| `src/core/stylistic/smart-filter-model.ts` | Auto-enhance parameters |
| `src/core/stylistic/pro-clarity-model.ts` | Clarity parameters |
| `src/core/stylistic/index.ts` | Barrel export |
| `src/features/editor/artistic-look-sheet.tsx` | Artistic Look picker UI |
| `src/features/editor/smart-filter-sheet.tsx` | Smart Filter controls UI |
| `src/features/editor/pro-clarity-sheet.tsx` | Pro Clarity sliders UI |
| `src/adapters/skia/artistic-look-shader.ts` | Skia shader for style effects |
| `src/adapters/skia/clarity-shader.ts` | Skia shader for clarity/sharpening |

### Modified Files

| Path | Changes |
|------|---------|
| `src/core/render/transform-executor.ts` | Add artistic-look, smart-filter, pro-clarity cases |
| `src/core/edit-session/edit-state.ts` | Add artisticLook, smartFilter, proClarity fields |
| `src/core/edit-session/edit-action.ts` | Add SET_ARTISTIC_LOOK, SET_SMART_FILTER, SET_PRO_CLARITY |
| `src/features/editor/editor-reducer.ts` | Handle new actions |
| `src/features/editor/tool-sheet.tsx` | Enable Phase 2 tools in grid |

---

## Task 1: Artistic Look Model and Transform

**Files:**
- Create: `src/core/stylistic/artistic-look-model.ts`
- Create: `src/core/render/artistic-look-transform.ts`
- Create: `src/adapters/skia/artistic-look-shader.ts`

### Step 1.1: Define Artistic Look model

- [ ] **Step 1.1.1: Create artistic look types**

```typescript
// src/core/stylistic/artistic-look-model.ts
export interface ArtisticLookParams {
  readonly styleId: string;
  readonly intensity: number;
}

export interface ArtisticLookStyle {
  readonly id: string;
  readonly name: string;
  readonly family: 'vintage' | 'film' | 'modern' | 'dramatic' | 'soft';
  readonly thumbnail: string;
  readonly colorMatrix: readonly number[];
  readonly vignetteStrength: number;
  readonly grainAmount: number;
  readonly contrastBoost: number;
  readonly saturationShift: number;
}

export const ARTISTIC_LOOK_STYLES: readonly ArtisticLookStyle[] = [
  {
    id: 'vintage-warm',
    name: 'Vintage Warm',
    family: 'vintage',
    thumbnail: 'assets/styles/vintage-warm.jpg',
    colorMatrix: [1.2, 0.1, 0, 0, 0.05, 0.1, 1.1, 0, 0, 0.02, 0, 0.1, 0.9, 0, -0.02, 0, 0, 0, 1, 0],
    vignetteStrength: 0.3,
    grainAmount: 0.15,
    contrastBoost: 0.1,
    saturationShift: -0.1,
  },
  {
    id: 'vintage-cool',
    name: 'Vintage Cool',
    family: 'vintage',
    thumbnail: 'assets/styles/vintage-cool.jpg',
    colorMatrix: [0.9, 0, 0.1, 0, -0.02, 0, 1.0, 0.1, 0, 0, 0.1, 0, 1.2, 0, 0.05, 0, 0, 0, 1, 0],
    vignetteStrength: 0.25,
    grainAmount: 0.1,
    contrastBoost: 0.05,
    saturationShift: -0.15,
  },
  {
    id: 'film-kodak',
    name: 'Film Kodak',
    family: 'film',
    thumbnail: 'assets/styles/film-kodak.jpg',
    colorMatrix: [1.1, 0.05, 0, 0, 0.03, 0, 1.05, 0.02, 0, 0.01, 0, 0.02, 0.95, 0, -0.01, 0, 0, 0, 1, 0],
    vignetteStrength: 0.15,
    grainAmount: 0.08,
    contrastBoost: 0.08,
    saturationShift: 0.05,
  },
  {
    id: 'film-fuji',
    name: 'Film Fuji',
    family: 'film',
    thumbnail: 'assets/styles/film-fuji.jpg',
    colorMatrix: [1.0, 0, 0.05, 0, 0, 0, 1.1, 0, 0, 0.02, 0.05, 0, 1.05, 0, 0.03, 0, 0, 0, 1, 0],
    vignetteStrength: 0.1,
    grainAmount: 0.05,
    contrastBoost: 0.12,
    saturationShift: 0.1,
  },
  {
    id: 'modern-crisp',
    name: 'Modern Crisp',
    family: 'modern',
    thumbnail: 'assets/styles/modern-crisp.jpg',
    colorMatrix: [1.05, 0, 0, 0, 0, 0, 1.05, 0, 0, 0, 0, 0, 1.05, 0, 0, 0, 0, 0, 1, 0],
    vignetteStrength: 0,
    grainAmount: 0,
    contrastBoost: 0.15,
    saturationShift: 0.1,
  },
  {
    id: 'dramatic-dark',
    name: 'Dramatic Dark',
    family: 'dramatic',
    thumbnail: 'assets/styles/dramatic-dark.jpg',
    colorMatrix: [1.1, 0, 0, 0, -0.05, 0, 1.1, 0, 0, -0.05, 0, 0, 1.1, 0, -0.05, 0, 0, 0, 1, 0],
    vignetteStrength: 0.5,
    grainAmount: 0.02,
    contrastBoost: 0.25,
    saturationShift: -0.05,
  },
  {
    id: 'soft-glow',
    name: 'Soft Glow',
    family: 'soft',
    thumbnail: 'assets/styles/soft-glow.jpg',
    colorMatrix: [1.0, 0.02, 0.02, 0, 0.05, 0.02, 1.0, 0.02, 0, 0.05, 0.02, 0.02, 1.0, 0, 0.05, 0, 0, 0, 1, 0],
    vignetteStrength: 0.1,
    grainAmount: 0,
    contrastBoost: -0.1,
    saturationShift: 0.05,
  },
];

export function getArtisticLookById(id: string): ArtisticLookStyle | undefined {
  return ARTISTIC_LOOK_STYLES.find((style) => style.id === id);
}
```

- [ ] **Step 1.1.2: Commit**

```bash
git add src/core/stylistic/artistic-look-model.ts
git commit -m "$(cat <<'EOF'
feat(stylistic): add Artistic Look model with preset styles
EOF
)"
```

### Step 1.2: Create Artistic Look shader

- [ ] **Step 1.2.1: Implement Skia shader**

```typescript
// src/adapters/skia/artistic-look-shader.ts
import { Skia } from '@shopify/react-native-skia';
import type { ArtisticLookStyle } from '@core/stylistic/artistic-look-model';

export function createArtisticLookShader(style: ArtisticLookStyle, intensity: number): string {
  const matrix = style.colorMatrix.map((v, i) => {
    if (i % 5 === 4) return v * intensity;
    if (i % 6 === 0) return 1 + (v - 1) * intensity;
    return v * intensity;
  });

  return `
    uniform shader image;
    uniform float intensity;
    uniform float vignette;
    uniform float grain;
    uniform float contrast;
    uniform float2 resolution;

    half4 main(float2 coord) {
      half4 color = image.eval(coord);
      
      // Apply color matrix
      half4x4 colorMatrix = half4x4(
        ${matrix[0]}, ${matrix[1]}, ${matrix[2]}, ${matrix[3]},
        ${matrix[5]}, ${matrix[6]}, ${matrix[7]}, ${matrix[8]},
        ${matrix[10]}, ${matrix[11]}, ${matrix[12]}, ${matrix[13]},
        ${matrix[15]}, ${matrix[16]}, ${matrix[17]}, ${matrix[18]}
      );
      half4 offset = half4(${matrix[4]}, ${matrix[9]}, ${matrix[14]}, ${matrix[19]});
      color = colorMatrix * color + offset;
      
      // Contrast
      color.rgb = (color.rgb - 0.5) * (1.0 + contrast * intensity) + 0.5;
      
      // Vignette
      float2 uv = coord / resolution;
      float2 center = uv - 0.5;
      float dist = length(center);
      float vig = 1.0 - smoothstep(0.3, 0.8, dist) * vignette * intensity;
      color.rgb *= vig;
      
      // Film grain
      float noise = fract(sin(dot(coord, float2(12.9898, 78.233))) * 43758.5453);
      color.rgb += (noise - 0.5) * grain * intensity;
      
      return saturate(color);
    }
  `;
}

export function compileArtisticLookEffect(style: ArtisticLookStyle, intensity: number) {
  const source = createArtisticLookShader(style, intensity);
  return Skia.RuntimeEffect.Make(source);
}
```

- [ ] **Step 1.2.2: Commit**

```bash
git add src/adapters/skia/artistic-look-shader.ts
git commit -m "$(cat <<'EOF'
feat(skia): add Artistic Look shader with color matrix, vignette, grain
EOF
)"
```

### Step 1.3: Create Artistic Look transform

- [ ] **Step 1.3.1: Implement transform**

```typescript
// src/core/render/artistic-look-transform.ts
import { getArtisticLookById, type ArtisticLookParams } from '@core/stylistic/artistic-look-model';
import { renderWithShader } from '@services/image/cpu-render.service';
import { compileArtisticLookEffect } from '@adapters/skia/artistic-look-shader';
import type { TransformResult } from './transform-executor';

export async function applyArtisticLook(
  uri: string,
  width: number,
  height: number,
  params: ArtisticLookParams,
): Promise<TransformResult> {
  const style = getArtisticLookById(params.styleId);
  if (!style) {
    return { uri, width, height };
  }

  const effect = compileArtisticLookEffect(style, params.intensity);
  if (!effect) {
    return { uri, width, height };
  }

  const resultUri = await renderWithShader(uri, width, height, effect, {
    intensity: params.intensity,
    vignette: style.vignetteStrength,
    grain: style.grainAmount,
    contrast: style.contrastBoost,
    resolution: [width, height],
  });

  return { uri: resultUri, width, height };
}
```

- [ ] **Step 1.3.2: Commit**

```bash
git add src/core/render/artistic-look-transform.ts
git commit -m "$(cat <<'EOF'
feat(render): add Artistic Look transform
EOF
)"
```

### Step 1.4: Wire to transform executor

- [ ] **Step 1.4.1: Add artistic-look case to transform executor**

```typescript
// Add to src/core/render/transform-executor.ts switch statement
import { applyArtisticLook } from './artistic-look-transform';

case 'artistic-look': {
  return applyArtisticLook(uri, width, height, transform.params);
}
```

- [ ] **Step 1.4.2: Write test for artistic look transform**

```typescript
// Add to src/core/render/transform-executor.test.ts
it('applies artistic-look transform', async () => {
  const context: TransformContext = {
    sourceUri: 'file:///test/image.jpg',
    sourceWidth: 1920,
    sourceHeight: 1080,
    transforms: [{
      type: 'artistic-look',
      params: { styleId: 'vintage-warm', intensity: 0.8 },
    }],
    mode: 'export',
  };

  const result = await executeTransforms(context);

  expect(result.uri).not.toBe('file:///test/image.jpg');
  expect(result.width).toBe(1920);
  expect(result.height).toBe(1080);
});
```

- [ ] **Step 1.4.3: Run test**

Run: `npm test -- --testPathPattern=transform-executor`
Expected: PASS

- [ ] **Step 1.4.4: Commit**

```bash
git add src/core/render/transform-executor.ts src/core/render/transform-executor.test.ts
git commit -m "$(cat <<'EOF'
feat(render): wire Artistic Look to transform executor
EOF
)"
```

---

## Task 2: Smart Filter Model and Transform

**Files:**
- Create: `src/core/stylistic/smart-filter-model.ts`
- Create: `src/core/render/smart-filter-transform.ts`

### Step 2.1: Define Smart Filter model

- [ ] **Step 2.1.1: Create smart filter types**

```typescript
// src/core/stylistic/smart-filter-model.ts
export interface SmartFilterParams {
  readonly enabled: boolean;
  readonly strength: number;
}

export interface SmartFilterAnalysis {
  readonly avgBrightness: number;
  readonly avgContrast: number;
  readonly avgSaturation: number;
  readonly isUnderexposed: boolean;
  readonly isOverexposed: boolean;
  readonly isLowContrast: boolean;
  readonly isFlatColors: boolean;
}

export interface SmartFilterCorrection {
  readonly exposureAdjust: number;
  readonly contrastAdjust: number;
  readonly saturationAdjust: number;
  readonly highlightsAdjust: number;
  readonly shadowsAdjust: number;
}

export function computeSmartFilterCorrection(
  analysis: SmartFilterAnalysis,
  strength: number,
): SmartFilterCorrection {
  let exposureAdjust = 0;
  let contrastAdjust = 0;
  let saturationAdjust = 0;
  let highlightsAdjust = 0;
  let shadowsAdjust = 0;

  if (analysis.isUnderexposed) {
    exposureAdjust = 0.3 * strength;
    shadowsAdjust = 0.2 * strength;
  }

  if (analysis.isOverexposed) {
    exposureAdjust = -0.2 * strength;
    highlightsAdjust = -0.3 * strength;
  }

  if (analysis.isLowContrast) {
    contrastAdjust = 0.15 * strength;
  }

  if (analysis.isFlatColors) {
    saturationAdjust = 0.1 * strength;
  }

  return {
    exposureAdjust,
    contrastAdjust,
    saturationAdjust,
    highlightsAdjust,
    shadowsAdjust,
  };
}
```

- [ ] **Step 2.1.2: Commit**

```bash
git add src/core/stylistic/smart-filter-model.ts
git commit -m "$(cat <<'EOF'
feat(stylistic): add Smart Filter model with deterministic analysis
EOF
)"
```

### Step 2.2: Create Smart Filter transform

- [ ] **Step 2.2.1: Implement transform**

```typescript
// src/core/render/smart-filter-transform.ts
import type { SmartFilterParams, SmartFilterAnalysis } from '@core/stylistic/smart-filter-model';
import { computeSmartFilterCorrection } from '@core/stylistic/smart-filter-model';
import { analyzeImage, applyCorrections } from '@services/image/cpu-render.service';
import type { TransformResult } from './transform-executor';

export async function applySmartFilter(
  uri: string,
  width: number,
  height: number,
  params: SmartFilterParams,
): Promise<TransformResult> {
  if (!params.enabled || params.strength === 0) {
    return { uri, width, height };
  }

  const analysis = await analyzeImage(uri, width, height);
  const correction = computeSmartFilterCorrection(analysis as SmartFilterAnalysis, params.strength);

  const resultUri = await applyCorrections(uri, width, height, {
    exposure: correction.exposureAdjust,
    contrast: correction.contrastAdjust,
    saturation: correction.saturationAdjust,
    highlights: correction.highlightsAdjust,
    shadows: correction.shadowsAdjust,
  });

  return { uri: resultUri, width, height };
}
```

- [ ] **Step 2.2.2: Commit**

```bash
git add src/core/render/smart-filter-transform.ts
git commit -m "$(cat <<'EOF'
feat(render): add Smart Filter transform with auto-analysis
EOF
)"
```

### Step 2.3: Wire to transform executor

- [ ] **Step 2.3.1: Add smart-filter case**

```typescript
// Add to src/core/render/transform-executor.ts
import { applySmartFilter } from './smart-filter-transform';

case 'smart-filter': {
  return applySmartFilter(uri, width, height, transform.params);
}
```

- [ ] **Step 2.3.2: Add test**

```typescript
// Add to src/core/render/transform-executor.test.ts
it('applies smart-filter transform', async () => {
  const context: TransformContext = {
    sourceUri: 'file:///test/underexposed.jpg',
    sourceWidth: 1920,
    sourceHeight: 1080,
    transforms: [{
      type: 'smart-filter',
      params: { enabled: true, strength: 0.7 },
    }],
    mode: 'export',
  };

  const result = await executeTransforms(context);

  expect(result.uri).not.toBe('file:///test/underexposed.jpg');
});
```

- [ ] **Step 2.3.3: Commit**

```bash
git add src/core/render/transform-executor.ts src/core/render/transform-executor.test.ts
git commit -m "$(cat <<'EOF'
feat(render): wire Smart Filter to transform executor
EOF
)"
```

---

## Task 3: Pro Clarity Model and Transform

**Files:**
- Create: `src/core/stylistic/pro-clarity-model.ts`
- Create: `src/core/render/pro-clarity-transform.ts`
- Create: `src/adapters/skia/clarity-shader.ts`

### Step 3.1: Define Pro Clarity model

- [ ] **Step 3.1.1: Create pro clarity types**

```typescript
// src/core/stylistic/pro-clarity-model.ts
export interface ProClarityParams {
  readonly clarity: number;
  readonly sharpness: number;
  readonly structure: number;
  readonly microContrast: number;
}

export const DEFAULT_PRO_CLARITY: ProClarityParams = Object.freeze({
  clarity: 0,
  sharpness: 0,
  structure: 0,
  microContrast: 0,
});

export function hasProClarityApplied(params: ProClarityParams): boolean {
  return (
    params.clarity !== 0 ||
    params.sharpness !== 0 ||
    params.structure !== 0 ||
    params.microContrast !== 0
  );
}
```

- [ ] **Step 3.1.2: Commit**

```bash
git add src/core/stylistic/pro-clarity-model.ts
git commit -m "$(cat <<'EOF'
feat(stylistic): add Pro Clarity model
EOF
)"
```

### Step 3.2: Create clarity shader

- [ ] **Step 3.2.1: Implement Skia shader**

```typescript
// src/adapters/skia/clarity-shader.ts
import { Skia } from '@shopify/react-native-skia';

export function createClarityShader(): string {
  return `
    uniform shader image;
    uniform float clarity;
    uniform float sharpness;
    uniform float structure;
    uniform float microContrast;
    uniform float2 resolution;

    half4 main(float2 coord) {
      half4 color = image.eval(coord);
      float2 texel = 1.0 / resolution;
      
      // Sample neighbors for edge detection
      half4 left = image.eval(coord - float2(texel.x, 0));
      half4 right = image.eval(coord + float2(texel.x, 0));
      half4 top = image.eval(coord - float2(0, texel.y));
      half4 bottom = image.eval(coord + float2(0, texel.y));
      
      // Laplacian for sharpening
      half4 laplacian = 4.0 * color - left - right - top - bottom;
      color.rgb += laplacian.rgb * sharpness * 0.5;
      
      // Local contrast for clarity
      half4 avg = (left + right + top + bottom) * 0.25;
      half4 diff = color - avg;
      color.rgb += diff.rgb * clarity * 0.3;
      
      // Structure enhancement (edge-aware)
      float edge = length(laplacian.rgb);
      color.rgb += diff.rgb * structure * edge * 0.2;
      
      // Micro contrast
      float luma = dot(color.rgb, half3(0.299, 0.587, 0.114));
      float localLuma = dot(avg.rgb, half3(0.299, 0.587, 0.114));
      float lumaDiff = luma - localLuma;
      color.rgb += lumaDiff * microContrast * 0.4;
      
      return saturate(color);
    }
  `;
}

export function compileClarityEffect() {
  const source = createClarityShader();
  return Skia.RuntimeEffect.Make(source);
}
```

- [ ] **Step 3.2.2: Commit**

```bash
git add src/adapters/skia/clarity-shader.ts
git commit -m "$(cat <<'EOF'
feat(skia): add clarity shader with sharpening and local contrast
EOF
)"
```

### Step 3.3: Create Pro Clarity transform

- [ ] **Step 3.3.1: Implement transform**

```typescript
// src/core/render/pro-clarity-transform.ts
import type { ProClarityParams } from '@core/stylistic/pro-clarity-model';
import { hasProClarityApplied } from '@core/stylistic/pro-clarity-model';
import { renderWithShader } from '@services/image/cpu-render.service';
import { compileClarityEffect } from '@adapters/skia/clarity-shader';
import type { TransformResult } from './transform-executor';

export async function applyProClarity(
  uri: string,
  width: number,
  height: number,
  params: ProClarityParams,
): Promise<TransformResult> {
  if (!hasProClarityApplied(params)) {
    return { uri, width, height };
  }

  const effect = compileClarityEffect();
  if (!effect) {
    return { uri, width, height };
  }

  const resultUri = await renderWithShader(uri, width, height, effect, {
    clarity: params.clarity,
    sharpness: params.sharpness,
    structure: params.structure,
    microContrast: params.microContrast,
    resolution: [width, height],
  });

  return { uri: resultUri, width, height };
}
```

- [ ] **Step 3.3.2: Commit**

```bash
git add src/core/render/pro-clarity-transform.ts
git commit -m "$(cat <<'EOF'
feat(render): add Pro Clarity transform
EOF
)"
```

### Step 3.4: Wire to transform executor

- [ ] **Step 3.4.1: Add pro-clarity case**

```typescript
// Add to src/core/render/transform-executor.ts
import { applyProClarity } from './pro-clarity-transform';

case 'pro-clarity': {
  return applyProClarity(uri, width, height, transform.params);
}
```

- [ ] **Step 3.4.2: Add test**

```typescript
// Add to src/core/render/transform-executor.test.ts
it('applies pro-clarity transform', async () => {
  const context: TransformContext = {
    sourceUri: 'file:///test/image.jpg',
    sourceWidth: 1920,
    sourceHeight: 1080,
    transforms: [{
      type: 'pro-clarity',
      params: { clarity: 0.5, sharpness: 0.3, structure: 0.2, microContrast: 0.1 },
    }],
    mode: 'export',
  };

  const result = await executeTransforms(context);

  expect(result.uri).not.toBe('file:///test/image.jpg');
});
```

- [ ] **Step 3.4.3: Commit**

```bash
git add src/core/render/transform-executor.ts src/core/render/transform-executor.test.ts
git commit -m "$(cat <<'EOF'
feat(render): wire Pro Clarity to transform executor
EOF
)"
```

---

## Task 4: Update EditState for Phase 2 Tools

**Files:**
- Modify: `src/core/edit-session/edit-state.ts`
- Modify: `src/core/edit-session/edit-action.ts`
- Modify: `src/features/editor/editor-reducer.ts`

### Step 4.1: Add fields to EditState

- [ ] **Step 4.1.1: Update edit-state.ts**

```typescript
// Add to src/core/edit-session/edit-state.ts

import type { ArtisticLookParams } from '@core/stylistic/artistic-look-model';
import type { SmartFilterParams } from '@core/stylistic/smart-filter-model';
import type { ProClarityParams } from '@core/stylistic/pro-clarity-model';

// Add to EditState interface:
readonly artisticLook: ArtisticLookParams | null;
readonly smartFilter: SmartFilterParams | null;
readonly proClarity: ProClarityParams | null;

// Update createInitialEditState:
artisticLook: null,
smartFilter: null,
proClarity: null,
```

- [ ] **Step 4.1.2: Commit**

```bash
git add src/core/edit-session/edit-state.ts
git commit -m "$(cat <<'EOF'
feat(edit-session): add Phase 2 tool fields to EditState
EOF
)"
```

### Step 4.2: Add EditActions

- [ ] **Step 4.2.1: Update edit-action.ts**

```typescript
// Add to src/core/edit-session/edit-action.ts

import type { ArtisticLookParams } from '@core/stylistic/artistic-look-model';
import type { SmartFilterParams } from '@core/stylistic/smart-filter-model';
import type { ProClarityParams } from '@core/stylistic/pro-clarity-model';

// Add to EditAction union:
| { readonly type: 'SET_ARTISTIC_LOOK'; readonly params: ArtisticLookParams }
| { readonly type: 'CLEAR_ARTISTIC_LOOK' }
| { readonly type: 'SET_SMART_FILTER'; readonly params: SmartFilterParams }
| { readonly type: 'CLEAR_SMART_FILTER' }
| { readonly type: 'SET_PRO_CLARITY'; readonly params: ProClarityParams }
| { readonly type: 'CLEAR_PRO_CLARITY' }
```

- [ ] **Step 4.2.2: Commit**

```bash
git add src/core/edit-session/edit-action.ts
git commit -m "$(cat <<'EOF'
feat(edit-session): add Phase 2 EditActions
EOF
)"
```

### Step 4.3: Update reducer

- [ ] **Step 4.3.1: Add cases to editor-reducer.ts**

```typescript
// Add to applyEditAction in src/features/editor/editor-reducer.ts

case 'SET_ARTISTIC_LOOK':
  return { ...state, artisticLook: action.params };
case 'CLEAR_ARTISTIC_LOOK':
  return { ...state, artisticLook: null };
case 'SET_SMART_FILTER':
  return { ...state, smartFilter: action.params };
case 'CLEAR_SMART_FILTER':
  return { ...state, smartFilter: null };
case 'SET_PRO_CLARITY':
  return { ...state, proClarity: action.params };
case 'CLEAR_PRO_CLARITY':
  return { ...state, proClarity: null };
```

- [ ] **Step 4.3.2: Commit**

```bash
git add src/features/editor/editor-reducer.ts
git commit -m "$(cat <<'EOF'
feat(editor): handle Phase 2 actions in reducer
EOF
)"
```

---

## Task 5: Artistic Look Sheet UI

**Files:**
- Create: `src/features/editor/artistic-look-sheet.tsx`

### Step 5.1: Implement ArtisticLookSheet

- [ ] **Step 5.1.1: Create component**

```typescript
// src/features/editor/artistic-look-sheet.tsx
import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@ui/layout/bottom-sheet';
import { Text } from '@ui/primitives/text';
import { Slider } from '@ui/primitives/slider';
import { IconButton } from '@ui/primitives/icon-button';
import { ARTISTIC_LOOK_STYLES, type ArtisticLookParams, type ArtisticLookStyle } from '@core/stylistic/artistic-look-model';
import { tokens } from '@theme/tokens';

interface ArtisticLookSheetProps {
  readonly visible: boolean;
  readonly initialParams: ArtisticLookParams | null;
  readonly onApply: (params: ArtisticLookParams | null) => void;
  readonly onCancel: () => void;
  readonly onPreview: (params: ArtisticLookParams | null) => void;
}

const FAMILIES = ['vintage', 'film', 'modern', 'dramatic', 'soft'] as const;

export function ArtisticLookSheet({
  visible,
  initialParams,
  onApply,
  onCancel,
  onPreview,
}: ArtisticLookSheetProps): React.JSX.Element {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(initialParams?.styleId ?? null);
  const [intensity, setIntensity] = useState(initialParams?.intensity ?? 1);
  const [activeFamily, setActiveFamily] = useState<typeof FAMILIES[number]>('vintage');

  const filteredStyles = ARTISTIC_LOOK_STYLES.filter((s) => s.family === activeFamily);

  const handleStyleSelect = useCallback(
    (style: ArtisticLookStyle) => {
      setSelectedStyle(style.id);
      onPreview({ styleId: style.id, intensity });
    },
    [intensity, onPreview],
  );

  const handleIntensityChange = useCallback(
    (value: number) => {
      setIntensity(value);
      if (selectedStyle) {
        onPreview({ styleId: selectedStyle, intensity: value });
      }
    },
    [selectedStyle, onPreview],
  );

  const handleApply = useCallback(() => {
    onApply(selectedStyle ? { styleId: selectedStyle, intensity } : null);
  }, [selectedStyle, intensity, onApply]);

  const handleClear = useCallback(() => {
    setSelectedStyle(null);
    setIntensity(1);
    onPreview(null);
  }, [onPreview]);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <Text style={styles.title}>ARTISTIC LOOK</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.families}>
        {FAMILIES.map((family) => (
          <Pressable
            key={family}
            style={[styles.familyTab, activeFamily === family && styles.familyTabActive]}
            onPress={() => setActiveFamily(family)}
          >
            <Text style={styles.familyText}>{family.charAt(0).toUpperCase() + family.slice(1)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filteredStyles}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.styleList}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.styleCard, selectedStyle === item.id && styles.styleCardSelected]}
            onPress={() => handleStyleSelect(item)}
          >
            <Image source={{ uri: item.thumbnail }} style={styles.styleThumbnail} />
            <Text style={styles.styleName}>{item.name}</Text>
          </Pressable>
        )}
      />

      <View style={styles.intensityRow}>
        <Text style={styles.intensityLabel}>Intensity: {Math.round(intensity * 100)}%</Text>
        <Slider value={intensity} minimumValue={0} maximumValue={1} onValueChange={handleIntensityChange} />
      </View>

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
  families: { marginBottom: 12 },
  familyTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: tokens.colors.surfaceDark2,
  },
  familyTabActive: { backgroundColor: tokens.colors.accent },
  familyText: { color: tokens.colors.textPrimary, fontSize: 12, textTransform: 'capitalize' },
  styleList: { marginBottom: 16 },
  styleCard: {
    width: 100,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleCardSelected: { borderColor: tokens.colors.accent },
  styleThumbnail: { width: '100%', aspectRatio: 1 },
  styleName: { color: tokens.colors.textSecondary, fontSize: 10, padding: 4, textAlign: 'center' },
  intensityRow: { marginBottom: 16 },
  intensityLabel: { color: tokens.colors.textSecondary, fontSize: 12, marginBottom: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
});
```

- [ ] **Step 5.1.2: Commit**

```bash
git add src/features/editor/artistic-look-sheet.tsx
git commit -m "$(cat <<'EOF'
feat(editor): add ArtisticLookSheet UI
EOF
)"
```

---

## Task 6: Smart Filter Sheet UI

**Files:**
- Create: `src/features/editor/smart-filter-sheet.tsx`

### Step 6.1: Implement SmartFilterSheet

- [ ] **Step 6.1.1: Create component**

```typescript
// src/features/editor/smart-filter-sheet.tsx
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheet } from '@ui/layout/bottom-sheet';
import { Text } from '@ui/primitives/text';
import { Slider } from '@ui/primitives/slider';
import { IconButton } from '@ui/primitives/icon-button';
import type { SmartFilterParams } from '@core/stylistic/smart-filter-model';
import { tokens } from '@theme/tokens';

interface SmartFilterSheetProps {
  readonly visible: boolean;
  readonly initialParams: SmartFilterParams | null;
  readonly onApply: (params: SmartFilterParams | null) => void;
  readonly onCancel: () => void;
  readonly onPreview: (params: SmartFilterParams | null) => void;
}

export function SmartFilterSheet({
  visible,
  initialParams,
  onApply,
  onCancel,
  onPreview,
}: SmartFilterSheetProps): React.JSX.Element {
  const [enabled, setEnabled] = useState(initialParams?.enabled ?? false);
  const [strength, setStrength] = useState(initialParams?.strength ?? 0.5);

  const handleToggle = useCallback(() => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    onPreview(newEnabled ? { enabled: true, strength } : null);
  }, [enabled, strength, onPreview]);

  const handleStrengthChange = useCallback(
    (value: number) => {
      setStrength(value);
      if (enabled) {
        onPreview({ enabled: true, strength: value });
      }
    },
    [enabled, onPreview],
  );

  const handleApply = useCallback(() => {
    onApply(enabled ? { enabled: true, strength } : null);
  }, [enabled, strength, onApply]);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <Text style={styles.title}>SMART FILTER</Text>

      <Text style={styles.description}>
        Automatically analyzes your photo and applies optimal corrections for exposure, contrast, and color balance.
      </Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Auto-Enhance</Text>
        <IconButton
          icon={enabled ? 'toggle-on' : 'toggle-off'}
          onPress={handleToggle}
          tintColor={enabled ? tokens.colors.accent : tokens.colors.textSecondary}
        />
      </View>

      {enabled && (
        <View style={styles.strengthRow}>
          <Text style={styles.strengthLabel}>Strength: {Math.round(strength * 100)}%</Text>
          <Slider value={strength} minimumValue={0.1} maximumValue={1} onValueChange={handleStrengthChange} />
        </View>
      )}

      <View style={styles.actions}>
        <IconButton icon="close" onPress={onCancel} />
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
    marginBottom: 12,
  },
  description: {
    color: tokens.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleLabel: { color: tokens.colors.textPrimary, fontSize: 14 },
  strengthRow: { marginBottom: 16 },
  strengthLabel: { color: tokens.colors.textSecondary, fontSize: 12, marginBottom: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
});
```

- [ ] **Step 6.1.2: Commit**

```bash
git add src/features/editor/smart-filter-sheet.tsx
git commit -m "$(cat <<'EOF'
feat(editor): add SmartFilterSheet UI
EOF
)"
```

---

## Task 7: Pro Clarity Sheet UI

**Files:**
- Create: `src/features/editor/pro-clarity-sheet.tsx`

### Step 7.1: Implement ProClaritySheet

- [ ] **Step 7.1.1: Create component**

```typescript
// src/features/editor/pro-clarity-sheet.tsx
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@ui/layout/bottom-sheet';
import { Text } from '@ui/primitives/text';
import { Slider } from '@ui/primitives/slider';
import { IconButton } from '@ui/primitives/icon-button';
import { DEFAULT_PRO_CLARITY, type ProClarityParams } from '@core/stylistic/pro-clarity-model';
import { tokens } from '@theme/tokens';

interface ProClaritySheetProps {
  readonly visible: boolean;
  readonly initialParams: ProClarityParams | null;
  readonly onApply: (params: ProClarityParams | null) => void;
  readonly onCancel: () => void;
  readonly onPreview: (params: ProClarityParams | null) => void;
}

const CLARITY_SLIDERS = [
  { key: 'clarity', label: 'Clarity', description: 'Enhance mid-tone contrast' },
  { key: 'sharpness', label: 'Sharpness', description: 'Sharpen edges and details' },
  { key: 'structure', label: 'Structure', description: 'Enhance texture definition' },
  { key: 'microContrast', label: 'Micro Contrast', description: 'Fine detail enhancement' },
] as const;

export function ProClaritySheet({
  visible,
  initialParams,
  onApply,
  onCancel,
  onPreview,
}: ProClaritySheetProps): React.JSX.Element {
  const [params, setParams] = useState<ProClarityParams>(initialParams ?? DEFAULT_PRO_CLARITY);

  const handleSliderChange = useCallback(
    (key: keyof ProClarityParams, value: number) => {
      setParams((prev) => {
        const next = { ...prev, [key]: value };
        onPreview(next);
        return next;
      });
    },
    [onPreview],
  );

  const handleReset = useCallback(() => {
    setParams(DEFAULT_PRO_CLARITY);
    onPreview(null);
  }, [onPreview]);

  const handleApply = useCallback(() => {
    const hasChanges = Object.values(params).some((v) => v !== 0);
    onApply(hasChanges ? params : null);
  }, [params, onApply]);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <Text style={styles.title}>PRO CLARITY</Text>

      <ScrollView style={styles.sliders}>
        {CLARITY_SLIDERS.map(({ key, label, description }) => (
          <View key={key} style={styles.sliderRow}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>{label}</Text>
              <Text style={styles.sliderValue}>{Math.round(params[key] * 100)}</Text>
            </View>
            <Text style={styles.sliderDescription}>{description}</Text>
            <Slider
              value={params[key]}
              minimumValue={-1}
              maximumValue={1}
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
  sliders: { maxHeight: 280 },
  sliderRow: { marginBottom: 20 },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sliderLabel: { color: tokens.colors.textPrimary, fontSize: 14 },
  sliderValue: { color: tokens.colors.textPrimary, fontSize: 12 },
  sliderDescription: { color: tokens.colors.textSecondary, fontSize: 10, marginBottom: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
});
```

- [ ] **Step 7.1.2: Commit**

```bash
git add src/features/editor/pro-clarity-sheet.tsx
git commit -m "$(cat <<'EOF'
feat(editor): add ProClaritySheet UI
EOF
)"
```

---

## Task 8: Enable Phase 2 Tools in Tool Grid

**Files:**
- Modify: `src/features/editor/tool-sheet.tsx`
- Modify: `src/features/editor/editor.screen.tsx`

### Step 8.1: Update ToolSheet

- [ ] **Step 8.1.1: Add Phase 2 tools to grid**

```typescript
// Update src/features/editor/tool-sheet.tsx
// Add Artistic Look, Smart Filter, Pro Clarity icons to the 9-tool grid

const TOOLS = [
  { id: 'crop', icon: 'crop', label: 'Crop' },
  { id: 'adjust', icon: 'tune', label: 'Adjust' },
  { id: 'lut', icon: 'palette', label: 'LUT' },
  { id: 'smart-filter', icon: 'auto-fix', label: 'Smart' },
  { id: 'pro-clarity', icon: 'hdr-strong', label: 'Pro' },
  { id: 'artistic-look', icon: 'brush', label: 'Artistic' },
  { id: 'border', icon: 'crop-square', label: 'Border' },
  { id: 'blend', icon: 'layers', label: 'Blend', disabled: true },
  { id: 'frame', icon: 'filter-frames', label: 'Frame' },
];
```

- [ ] **Step 8.1.2: Commit**

```bash
git add src/features/editor/tool-sheet.tsx
git commit -m "$(cat <<'EOF'
feat(editor): enable Phase 2 tools in tool grid
EOF
)"
```

### Step 8.2: Wire sheets to EditorScreen

- [ ] **Step 8.2.1: Add sheet state and handlers**

```typescript
// Update src/features/editor/editor.screen.tsx
// Add state for Phase 2 sheets and handlers

type SheetType = 'tools' | 'crop' | 'adjust' | 'lut' | 'log' | 'export' 
  | 'artistic-look' | 'smart-filter' | 'pro-clarity' | null;

// Add sheet components with appropriate handlers
```

- [ ] **Step 8.2.2: Commit**

```bash
git add src/features/editor/editor.screen.tsx
git commit -m "$(cat <<'EOF'
feat(editor): wire Phase 2 tool sheets to Editor
EOF
)"
```

---

## Task 9: Barrel Exports and Tests

**Files:**
- Create: `src/core/stylistic/index.ts`
- Create: `src/features/editor/index.ts` (update)

### Step 9.1: Create barrel exports

- [ ] **Step 9.1.1: Create stylistic barrel**

```typescript
// src/core/stylistic/index.ts
export type { ArtisticLookParams, ArtisticLookStyle } from './artistic-look-model';
export { ARTISTIC_LOOK_STYLES, getArtisticLookById } from './artistic-look-model';
export type { SmartFilterParams, SmartFilterAnalysis, SmartFilterCorrection } from './smart-filter-model';
export { computeSmartFilterCorrection } from './smart-filter-model';
export type { ProClarityParams } from './pro-clarity-model';
export { DEFAULT_PRO_CLARITY, hasProClarityApplied } from './pro-clarity-model';
```

- [ ] **Step 9.1.2: Commit**

```bash
git add src/core/stylistic/index.ts
git commit -m "$(cat <<'EOF'
feat(stylistic): add barrel exports
EOF
)"
```

### Step 9.2: Add integration tests

- [ ] **Step 9.2.1: Write Phase 2 integration test**

```typescript
// __tests__/features/editor.phase-2-tools.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EditorScreen } from '@features/editor';

describe('Phase 2 Tools', () => {
  it('opens Artistic Look sheet from Tools grid', async () => {
    const { getByLabelText, getByText } = render(<EditorScreen />);

    fireEvent.press(getByLabelText('Tools'));
    fireEvent.press(getByLabelText('Artistic'));

    await waitFor(() => {
      expect(getByText('ARTISTIC LOOK')).toBeTruthy();
    });
  });

  it('opens Smart Filter sheet from Tools grid', async () => {
    const { getByLabelText, getByText } = render(<EditorScreen />);

    fireEvent.press(getByLabelText('Tools'));
    fireEvent.press(getByLabelText('Smart'));

    await waitFor(() => {
      expect(getByText('SMART FILTER')).toBeTruthy();
    });
  });

  it('opens Pro Clarity sheet from Tools grid', async () => {
    const { getByLabelText, getByText } = render(<EditorScreen />);

    fireEvent.press(getByLabelText('Tools'));
    fireEvent.press(getByLabelText('Pro'));

    await waitFor(() => {
      expect(getByText('PRO CLARITY')).toBeTruthy();
    });
  });
});
```

- [ ] **Step 9.2.2: Run tests**

Run: `npm test -- --testPathPattern=phase-2-tools`
Expected: PASS

- [ ] **Step 9.2.3: Commit**

```bash
git add __tests__/features/editor.phase-2-tools.test.tsx
git commit -m "$(cat <<'EOF'
test(editor): add Phase 2 tools integration tests
EOF
)"
```

---

## Task 10: Final Verification

### Step 10.1: Run full test suite

- [ ] **Step 10.1.1: Run all tests**

Run: `npm test`
Expected: All tests pass

### Step 10.2: Manual QA checklist

- [ ] **Step 10.2.1: Verify Artistic Look**
  - Open Tools > Artistic
  - Select different styles
  - Adjust intensity
  - Verify preview updates
  - Apply and export

- [ ] **Step 10.2.2: Verify Smart Filter**
  - Open Tools > Smart
  - Enable auto-enhance
  - Adjust strength
  - Verify corrections applied
  - Export

- [ ] **Step 10.2.3: Verify Pro Clarity**
  - Open Tools > Pro
  - Adjust all 4 sliders
  - Verify sharpening visible
  - Reset and verify
  - Apply and export

### Step 10.3: Final commit

- [ ] **Step 10.3.1: Commit any remaining changes**

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: complete Phase 2 - Stylistic Tools

- Artistic Look with 7 preset styles across 5 families
- Smart Filter with deterministic auto-enhance
- Pro Clarity with clarity/sharpness/structure/microContrast
- All tools integrated into transform executor for parity
- Sheet UIs for all Phase 2 tools
EOF
)"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-phase-2-stylistic-tools.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
