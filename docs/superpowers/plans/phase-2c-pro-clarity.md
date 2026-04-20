# Phase 2C: Pro Clarity

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add Pro Clarity tool with clarity, sharpness, structure, and micro-contrast controls.

**Architecture:** Skia shader with local contrast and edge enhancement algorithms.

**Tech Stack:** TypeScript, @shopify/react-native-skia

**Estimated context:** ~30K tokens

**Prerequisites:** Phase 2B complete

---

## File Structure

### New Files
| Path | Responsibility |
|------|----------------|
| `src/core/stylistic/pro-clarity-model.ts` | Clarity parameters |
| `src/adapters/skia/clarity-shader.ts` | Skia runtime effect |
| `src/core/render/pro-clarity-transform.ts` | Transform implementation |
| `src/features/editor/pro-clarity-sheet.tsx` | UI component |

---

## Task 1: Pro Clarity Model

### Step 1.1: Create model

- [ ] **Step 1.1.1: Create model file**

```typescript
// src/core/stylistic/pro-clarity-model.ts
export interface ProClarityParams {
  readonly clarity: number;      // Mid-tone local contrast
  readonly sharpness: number;    // Edge sharpening
  readonly structure: number;    // Texture definition
  readonly microContrast: number; // Fine detail enhancement
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

export function clampProClarityParams(params: Partial<ProClarityParams>): ProClarityParams {
  const clamp = (v: number | undefined, min: number, max: number) => 
    Math.max(min, Math.min(max, v ?? 0));
  
  return {
    clarity: clamp(params.clarity, -1, 1),
    sharpness: clamp(params.sharpness, -1, 1),
    structure: clamp(params.structure, -1, 1),
    microContrast: clamp(params.microContrast, -1, 1),
  };
}
```

- [ ] **Step 1.1.2: Commit**

```bash
git add src/core/stylistic/pro-clarity-model.ts
git commit -m "feat(stylistic): add Pro Clarity model"
```

---

## Task 2: Skia Shader

### Step 2.1: Create clarity shader

- [ ] **Step 2.1.1: Implement shader**

```typescript
// src/adapters/skia/clarity-shader.ts
import { Skia } from '@shopify/react-native-skia';

export function createClarityShaderSource(): string {
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
      
      // Local contrast for clarity (mid-tone emphasis)
      half4 avg = (left + right + top + bottom) * 0.25;
      half4 diff = color - avg;
      color.rgb += diff.rgb * clarity * 0.3;
      
      // Structure enhancement (edge-aware local contrast)
      float edge = length(laplacian.rgb);
      color.rgb += diff.rgb * structure * edge * 0.2;
      
      // Micro contrast (fine luminance detail)
      float luma = dot(color.rgb, half3(0.299, 0.587, 0.114));
      float localLuma = dot(avg.rgb, half3(0.299, 0.587, 0.114));
      float lumaDiff = luma - localLuma;
      color.rgb += lumaDiff * microContrast * 0.4;
      
      return saturate(color);
    }
  `;
}

export function compileClarityEffect() {
  const source = createClarityShaderSource();
  return Skia.RuntimeEffect.Make(source);
}

export function buildClarityUniforms(
  params: {
    clarity: number;
    sharpness: number;
    structure: number;
    microContrast: number;
  },
  width: number,
  height: number,
) {
  return {
    clarity: params.clarity,
    sharpness: params.sharpness,
    structure: params.structure,
    microContrast: params.microContrast,
    resolution: [width, height],
  };
}
```

- [ ] **Step 2.1.2: Commit**

```bash
git add src/adapters/skia/clarity-shader.ts
git commit -m "feat(skia): add clarity shader"
```

---

## Task 3: Transform Implementation

### Step 3.1: Create transform

- [ ] **Step 3.1.1: Implement transform**

```typescript
// src/core/render/pro-clarity-transform.ts
import type { ProClarityParams } from '@core/stylistic/pro-clarity-model';
import { hasProClarityApplied } from '@core/stylistic/pro-clarity-model';
import { renderWithShader } from '@services/image/cpu-render.service';
import { compileClarityEffect, buildClarityUniforms } from '@adapters/skia/clarity-shader';
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

  const uniforms = buildClarityUniforms(params, width, height);
  const resultUri = await renderWithShader(uri, width, height, effect, uniforms);

  return { uri: resultUri, width, height };
}
```

- [ ] **Step 3.1.2: Wire to transform executor**

```typescript
// Add to src/core/render/transform-executor.ts
import { applyProClarity } from './pro-clarity-transform';

case 'pro-clarity': {
  return applyProClarity(uri, width, height, transform.params);
}
```

- [ ] **Step 3.1.3: Add test**

```typescript
// Add to transform-executor.test.ts
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
  expect(result.width).toBe(1920);
});
```

- [ ] **Step 3.1.4: Commit**

```bash
git add src/core/render/
git commit -m "feat(render): add Pro Clarity transform"
```

---

## Task 4: UI Sheet

### Step 4.1: Create ProClaritySheet

- [ ] **Step 4.1.1: Implement component**

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

const SLIDERS = [
  { 
    key: 'clarity' as const, 
    label: 'Clarity', 
    description: 'Enhance mid-tone contrast',
  },
  { 
    key: 'sharpness' as const, 
    label: 'Sharpness', 
    description: 'Sharpen edges and details',
  },
  { 
    key: 'structure' as const, 
    label: 'Structure', 
    description: 'Enhance texture definition',
  },
  { 
    key: 'microContrast' as const, 
    label: 'Micro Contrast', 
    description: 'Fine detail enhancement',
  },
];

export function ProClaritySheet({
  visible,
  initialParams,
  onApply,
  onCancel,
  onPreview,
}: ProClaritySheetProps): React.JSX.Element {
  const [params, setParams] = useState<ProClarityParams>(
    initialParams ?? DEFAULT_PRO_CLARITY
  );

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
        {SLIDERS.map(({ key, label, description }) => (
          <View key={key} style={styles.sliderRow}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>{label}</Text>
              <Text style={styles.sliderValue}>
                {Math.round(params[key] * 100)}
              </Text>
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
  sliders: { 
    maxHeight: 280,
  },
  sliderRow: { 
    marginBottom: 20,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sliderLabel: { 
    color: tokens.colors.textPrimary, 
    fontSize: 14,
  },
  sliderValue: { 
    color: tokens.colors.textPrimary, 
    fontSize: 12,
  },
  sliderDescription: { 
    color: tokens.colors.textSecondary, 
    fontSize: 10, 
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
});
```

- [ ] **Step 4.1.2: Commit**

```bash
git add src/features/editor/pro-clarity-sheet.tsx
git commit -m "feat(editor): add ProClaritySheet"
```

---

## Completion Checklist

- [ ] Pro Clarity model with 4 parameters
- [ ] Skia shader with local contrast algorithms
- [ ] Transform integrates with executor
- [ ] UI with 4 sliders and descriptions

**Next:** Phase 2D - Integration
