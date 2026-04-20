# Phase 2A: Artistic Look

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add Artistic Look tool with preset style families (vintage, film, modern, dramatic, soft).

**Architecture:** Style model defines color matrix + vignette + grain. Skia shader applies effects. Transform integrates with executor.

**Tech Stack:** TypeScript, @shopify/react-native-skia

**Estimated context:** ~35K tokens

**Prerequisites:** Phase 1 complete

---

## File Structure

### New Files
| Path | Responsibility |
|------|----------------|
| `src/core/stylistic/artistic-look-model.ts` | Style definitions |
| `src/adapters/skia/artistic-look-shader.ts` | Skia runtime effect |
| `src/core/render/artistic-look-transform.ts` | Transform implementation |
| `src/features/editor/artistic-look-sheet.tsx` | UI component |

---

## Task 1: Artistic Look Model

### Step 1.1: Create style definitions

- [ ] **Step 1.1.1: Create model file**

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
  readonly colorMatrix: readonly number[];
  readonly vignetteStrength: number;
  readonly grainAmount: number;
  readonly contrastBoost: number;
}

export const ARTISTIC_LOOK_STYLES: readonly ArtisticLookStyle[] = [
  {
    id: 'vintage-warm',
    name: 'Vintage Warm',
    family: 'vintage',
    colorMatrix: [1.2, 0.1, 0, 0, 0.05, 0.1, 1.1, 0, 0, 0.02, 0, 0.1, 0.9, 0, -0.02, 0, 0, 0, 1, 0],
    vignetteStrength: 0.3,
    grainAmount: 0.15,
    contrastBoost: 0.1,
  },
  {
    id: 'vintage-cool',
    name: 'Vintage Cool',
    family: 'vintage',
    colorMatrix: [0.9, 0, 0.1, 0, -0.02, 0, 1.0, 0.1, 0, 0, 0.1, 0, 1.2, 0, 0.05, 0, 0, 0, 1, 0],
    vignetteStrength: 0.25,
    grainAmount: 0.1,
    contrastBoost: 0.05,
  },
  {
    id: 'film-kodak',
    name: 'Film Kodak',
    family: 'film',
    colorMatrix: [1.1, 0.05, 0, 0, 0.03, 0, 1.05, 0.02, 0, 0.01, 0, 0.02, 0.95, 0, -0.01, 0, 0, 0, 1, 0],
    vignetteStrength: 0.15,
    grainAmount: 0.08,
    contrastBoost: 0.08,
  },
  {
    id: 'film-fuji',
    name: 'Film Fuji',
    family: 'film',
    colorMatrix: [1.0, 0, 0.05, 0, 0, 0, 1.1, 0, 0, 0.02, 0.05, 0, 1.05, 0, 0.03, 0, 0, 0, 1, 0],
    vignetteStrength: 0.1,
    grainAmount: 0.05,
    contrastBoost: 0.12,
  },
  {
    id: 'modern-crisp',
    name: 'Modern Crisp',
    family: 'modern',
    colorMatrix: [1.05, 0, 0, 0, 0, 0, 1.05, 0, 0, 0, 0, 0, 1.05, 0, 0, 0, 0, 0, 1, 0],
    vignetteStrength: 0,
    grainAmount: 0,
    contrastBoost: 0.15,
  },
  {
    id: 'dramatic-dark',
    name: 'Dramatic Dark',
    family: 'dramatic',
    colorMatrix: [1.1, 0, 0, 0, -0.05, 0, 1.1, 0, 0, -0.05, 0, 0, 1.1, 0, -0.05, 0, 0, 0, 1, 0],
    vignetteStrength: 0.5,
    grainAmount: 0.02,
    contrastBoost: 0.25,
  },
  {
    id: 'soft-glow',
    name: 'Soft Glow',
    family: 'soft',
    colorMatrix: [1.0, 0.02, 0.02, 0, 0.05, 0.02, 1.0, 0.02, 0, 0.05, 0.02, 0.02, 1.0, 0, 0.05, 0, 0, 0, 1, 0],
    vignetteStrength: 0.1,
    grainAmount: 0,
    contrastBoost: -0.1,
  },
];

export function getArtisticLookById(id: string): ArtisticLookStyle | undefined {
  return ARTISTIC_LOOK_STYLES.find((style) => style.id === id);
}

export function getStylesByFamily(family: ArtisticLookStyle['family']): ArtisticLookStyle[] {
  return ARTISTIC_LOOK_STYLES.filter((style) => style.family === family);
}
```

- [ ] **Step 1.1.2: Commit**

```bash
git add src/core/stylistic/artistic-look-model.ts
git commit -m "feat(stylistic): add Artistic Look model with 7 preset styles"
```

---

## Task 2: Skia Shader

### Step 2.1: Create artistic look shader

- [ ] **Step 2.1.1: Implement shader**

```typescript
// src/adapters/skia/artistic-look-shader.ts
import { Skia } from '@shopify/react-native-skia';
import type { ArtisticLookStyle } from '@core/stylistic/artistic-look-model';

export function createArtisticLookShaderSource(): string {
  return `
    uniform shader image;
    uniform half4x4 colorMatrix;
    uniform half4 colorOffset;
    uniform float intensity;
    uniform float vignette;
    uniform float grain;
    uniform float contrast;
    uniform float2 resolution;

    half4 main(float2 coord) {
      half4 color = image.eval(coord);
      
      // Apply color matrix with intensity
      half4 transformed = colorMatrix * color + colorOffset;
      color = mix(color, transformed, intensity);
      
      // Contrast adjustment
      color.rgb = (color.rgb - 0.5) * (1.0 + contrast * intensity) + 0.5;
      
      // Vignette
      float2 uv = coord / resolution;
      float2 center = uv - 0.5;
      float dist = length(center);
      float vig = 1.0 - smoothstep(0.3, 0.8, dist) * vignette * intensity;
      color.rgb *= vig;
      
      // Film grain
      float n = fract(sin(dot(coord, float2(12.9898, 78.233))) * 43758.5453);
      color.rgb += (n - 0.5) * grain * intensity;
      
      return saturate(color);
    }
  `;
}

export function compileArtisticLookEffect() {
  const source = createArtisticLookShaderSource();
  return Skia.RuntimeEffect.Make(source);
}

export function buildArtisticLookUniforms(
  style: ArtisticLookStyle,
  intensity: number,
  width: number,
  height: number,
) {
  const m = style.colorMatrix;
  return {
    colorMatrix: [
      m[0], m[1], m[2], m[3],
      m[5], m[6], m[7], m[8],
      m[10], m[11], m[12], m[13],
      m[15], m[16], m[17], m[18],
    ],
    colorOffset: [m[4], m[9], m[14], m[19]],
    intensity,
    vignette: style.vignetteStrength,
    grain: style.grainAmount,
    contrast: style.contrastBoost,
    resolution: [width, height],
  };
}
```

- [ ] **Step 2.1.2: Commit**

```bash
git add src/adapters/skia/artistic-look-shader.ts
git commit -m "feat(skia): add Artistic Look shader"
```

---

## Task 3: Transform Implementation

### Step 3.1: Create transform

- [ ] **Step 3.1.1: Implement transform**

```typescript
// src/core/render/artistic-look-transform.ts
import { getArtisticLookById, type ArtisticLookParams } from '@core/stylistic/artistic-look-model';
import { renderWithShader } from '@services/image/cpu-render.service';
import { compileArtisticLookEffect, buildArtisticLookUniforms } from '@adapters/skia/artistic-look-shader';
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

  const effect = compileArtisticLookEffect();
  if (!effect) {
    return { uri, width, height };
  }

  const uniforms = buildArtisticLookUniforms(style, params.intensity, width, height);
  const resultUri = await renderWithShader(uri, width, height, effect, uniforms);

  return { uri: resultUri, width, height };
}
```

- [ ] **Step 3.1.2: Wire to transform executor**

```typescript
// Add to src/core/render/transform-executor.ts switch statement
import { applyArtisticLook } from './artistic-look-transform';

case 'artistic-look': {
  return applyArtisticLook(uri, width, height, transform.params);
}
```

- [ ] **Step 3.1.3: Add test**

```typescript
// Add to transform-executor.test.ts
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
  expect(result.width).toBe(1920);
  expect(result.height).toBe(1080);
});
```

- [ ] **Step 3.1.4: Commit**

```bash
git add src/core/render/
git commit -m "feat(render): add Artistic Look transform"
```

---

## Task 4: UI Sheet

### Step 4.1: Create ArtisticLookSheet

- [ ] **Step 4.1.1: Implement component**

```typescript
// src/features/editor/artistic-look-sheet.tsx
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BottomSheet } from '@ui/layout/bottom-sheet';
import { Text } from '@ui/primitives/text';
import { Slider } from '@ui/primitives/slider';
import { IconButton } from '@ui/primitives/icon-button';
import { 
  ARTISTIC_LOOK_STYLES, 
  getStylesByFamily,
  type ArtisticLookParams, 
  type ArtisticLookStyle,
} from '@core/stylistic/artistic-look-model';
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
  const [selectedStyle, setSelectedStyle] = useState<string | null>(
    initialParams?.styleId ?? null
  );
  const [intensity, setIntensity] = useState(initialParams?.intensity ?? 1);
  const [activeFamily, setActiveFamily] = useState<typeof FAMILIES[number]>('vintage');

  const filteredStyles = getStylesByFamily(activeFamily);

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
            <Text style={styles.familyText}>
              {family.charAt(0).toUpperCase() + family.slice(1)}
            </Text>
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
            <View style={styles.stylePreview} />
            <Text style={styles.styleName}>{item.name}</Text>
          </Pressable>
        )}
      />

      <View style={styles.intensityRow}>
        <Text style={styles.intensityLabel}>
          Intensity: {Math.round(intensity * 100)}%
        </Text>
        <Slider 
          value={intensity} 
          minimumValue={0} 
          maximumValue={1} 
          onValueChange={handleIntensityChange} 
        />
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
  familyText: { color: tokens.colors.textPrimary, fontSize: 12 },
  styleList: { marginBottom: 16 },
  styleCard: {
    width: 80,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: tokens.colors.surfaceDark2,
  },
  styleCardSelected: { borderColor: tokens.colors.accent },
  stylePreview: { width: '100%', aspectRatio: 1, backgroundColor: tokens.colors.surfaceDark1 },
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

- [ ] **Step 4.1.2: Commit**

```bash
git add src/features/editor/artistic-look-sheet.tsx
git commit -m "feat(editor): add ArtisticLookSheet"
```

---

## Completion Checklist

- [ ] 7 preset styles across 5 families defined
- [ ] Skia shader compiles and applies effects
- [ ] Transform integrates with executor
- [ ] UI sheet with family tabs and intensity slider

**Next:** Phase 2B - Smart Filter
