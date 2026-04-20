# Phase 2B: Smart Filter

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add Smart Filter tool with deterministic auto-enhance (NOT AI - purely algorithmic).

**Architecture:** Analyze image histogram, compute corrections, apply via existing adjustment pipeline.

**Tech Stack:** TypeScript, image analysis algorithms

**Estimated context:** ~25K tokens

**Prerequisites:** Phase 2A complete

---

## File Structure

### New Files
| Path | Responsibility |
|------|----------------|
| `src/core/stylistic/smart-filter-model.ts` | Analysis and correction types |
| `src/core/render/smart-filter-transform.ts` | Transform implementation |
| `src/features/editor/smart-filter-sheet.tsx` | UI component |

---

## Task 1: Smart Filter Model

### Step 1.1: Create analysis model

- [ ] **Step 1.1.1: Create model file**

```typescript
// src/core/stylistic/smart-filter-model.ts
export interface SmartFilterParams {
  readonly enabled: boolean;
  readonly strength: number;
}

export interface ImageAnalysis {
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
  analysis: ImageAnalysis,
  strength: number,
): SmartFilterCorrection {
  let exposureAdjust = 0;
  let contrastAdjust = 0;
  let saturationAdjust = 0;
  let highlightsAdjust = 0;
  let shadowsAdjust = 0;

  // Underexposed: brighten + lift shadows
  if (analysis.isUnderexposed) {
    exposureAdjust = 0.3 * strength;
    shadowsAdjust = 0.2 * strength;
  }

  // Overexposed: darken + recover highlights
  if (analysis.isOverexposed) {
    exposureAdjust = -0.2 * strength;
    highlightsAdjust = -0.3 * strength;
  }

  // Low contrast: boost contrast
  if (analysis.isLowContrast) {
    contrastAdjust = 0.15 * strength;
  }

  // Flat colors: boost saturation slightly
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

export const DEFAULT_SMART_FILTER: SmartFilterParams = {
  enabled: false,
  strength: 0.5,
};
```

- [ ] **Step 1.1.2: Commit**

```bash
git add src/core/stylistic/smart-filter-model.ts
git commit -m "feat(stylistic): add Smart Filter model with deterministic analysis"
```

---

## Task 2: Transform Implementation

### Step 2.1: Create transform

- [ ] **Step 2.1.1: Implement transform**

```typescript
// src/core/render/smart-filter-transform.ts
import type { SmartFilterParams, ImageAnalysis, SmartFilterCorrection } from '@core/stylistic/smart-filter-model';
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

  // Analyze image to determine what corrections are needed
  const analysis = await analyzeImage(uri, width, height);
  
  // Compute deterministic corrections based on analysis
  const correction = computeSmartFilterCorrection(
    analysis as ImageAnalysis, 
    params.strength
  );

  // Apply corrections if any are non-zero
  const hasCorrections = 
    correction.exposureAdjust !== 0 ||
    correction.contrastAdjust !== 0 ||
    correction.saturationAdjust !== 0 ||
    correction.highlightsAdjust !== 0 ||
    correction.shadowsAdjust !== 0;

  if (!hasCorrections) {
    return { uri, width, height };
  }

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

- [ ] **Step 2.1.2: Wire to transform executor**

```typescript
// Add to src/core/render/transform-executor.ts
import { applySmartFilter } from './smart-filter-transform';

case 'smart-filter': {
  return applySmartFilter(uri, width, height, transform.params);
}
```

- [ ] **Step 2.1.3: Add test**

```typescript
// Add to transform-executor.test.ts
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
  expect(result.width).toBe(1920);
});
```

- [ ] **Step 2.1.4: Commit**

```bash
git add src/core/render/
git commit -m "feat(render): add Smart Filter transform"
```

---

## Task 3: UI Sheet

### Step 3.1: Create SmartFilterSheet

- [ ] **Step 3.1.1: Implement component**

```typescript
// src/features/editor/smart-filter-sheet.tsx
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
        Automatically analyzes your photo and applies optimal corrections 
        for exposure, contrast, and color balance.
      </Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Auto-Enhance</Text>
        <Pressable 
          style={[styles.toggleButton, enabled && styles.toggleButtonActive]}
          onPress={handleToggle}
        >
          <Text style={styles.toggleText}>{enabled ? 'ON' : 'OFF'}</Text>
        </Pressable>
      </View>

      {enabled && (
        <View style={styles.strengthRow}>
          <Text style={styles.strengthLabel}>
            Strength: {Math.round(strength * 100)}%
          </Text>
          <Slider 
            value={strength} 
            minimumValue={0.1} 
            maximumValue={1} 
            onValueChange={handleStrengthChange} 
          />
        </View>
      )}

      <View style={styles.infoBox}>
        <IconButton icon="info" size={16} />
        <Text style={styles.infoText}>
          Smart Filter uses deterministic algorithms to enhance your photo. 
          No AI or cloud processing required.
        </Text>
      </View>

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
  toggleLabel: { 
    color: tokens.colors.textPrimary, 
    fontSize: 14,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: tokens.colors.surfaceDark2,
  },
  toggleButtonActive: {
    backgroundColor: tokens.colors.accent,
  },
  toggleText: {
    color: tokens.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  strengthRow: { 
    marginBottom: 16,
  },
  strengthLabel: { 
    color: tokens.colors.textSecondary, 
    fontSize: 12, 
    marginBottom: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: tokens.colors.surfaceDark2,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    color: tokens.colors.textSecondary,
    fontSize: 11,
    flex: 1,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
});
```

- [ ] **Step 3.1.2: Commit**

```bash
git add src/features/editor/smart-filter-sheet.tsx
git commit -m "feat(editor): add SmartFilterSheet"
```

---

## Completion Checklist

- [ ] Smart Filter model with analysis types
- [ ] Deterministic correction algorithm
- [ ] Transform integrates with executor
- [ ] UI with toggle and strength slider
- [ ] Clear messaging that it's NOT AI

**Next:** Phase 2C - Pro Clarity
