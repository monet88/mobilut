# Phase 1E: Tool Sheets

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Create bottom sheet UIs for all Phase 1 tools (Crop, Adjust, LUT, Modification Log, Export).

**Architecture:** Each sheet is a standalone component using BottomSheet. Sheets manage local state and call back to editor on apply/cancel.

**Tech Stack:** React Native, TypeScript

**Estimated context:** ~50K tokens

**Prerequisites:** Phase 1D (Editor Shell) complete

---

## File Structure

### New Files
| Path | Responsibility |
|------|----------------|
| `src/features/editor/tool-sheet.tsx` | Full 9-tool grid sheet |
| `src/features/editor/crop-sheet.tsx` | Crop/transform controls |
| `src/features/editor/adjust-sheet.tsx` | Adjustment sliders |
| `src/features/editor/lut-picker-sheet.tsx` | LUT picker with categories |
| `src/features/editor/modification-log-sheet.tsx` | History list |
| `src/features/editor/export-sheet.tsx` | Export format selection |
| `src/features/editor/use-modification-log.ts` | Coalesced history |

---

## Task 1: Tool Sheet (Full Grid)

**Files:**
- Create: `src/features/editor/tool-sheet.tsx`

### Step 1.1: Implement ToolSheet

- [ ] **Step 1.1.1: Create component**

```typescript
// src/features/editor/tool-sheet.tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { BottomSheet } from '@ui/layout/bottom-sheet';
import { Text } from '@ui/primitives/text';
import { ToolGrid, type ToolItem } from '@ui/composite/tool-grid';
import { tokens } from '@theme/tokens';

interface ToolSheetProps {
  readonly visible: boolean;
  readonly onToolSelect: (toolId: string) => void;
  readonly onClose: () => void;
}

const TOOLS: ToolItem[] = [
  { id: 'crop', icon: 'crop', label: 'Crop' },
  { id: 'adjust', icon: 'tune', label: 'Adjust' },
  { id: 'lut', icon: 'palette', label: 'LUT' },
  { id: 'smart-filter', icon: 'auto-fix', label: 'Smart', disabled: true },
  { id: 'pro-clarity', icon: 'hdr-strong', label: 'Pro', disabled: true },
  { id: 'artistic-look', icon: 'brush', label: 'Artistic', disabled: true },
  { id: 'border', icon: 'crop-square', label: 'Border' },
  { id: 'blend', icon: 'layers', label: 'Blend', disabled: true },
  { id: 'frame', icon: 'filter-frames', label: 'Frame' },
];

export function ToolSheet({ 
  visible, 
  onToolSelect, 
  onClose,
}: ToolSheetProps): React.JSX.Element {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.title}>TOOLS</Text>
      <ToolGrid 
        tools={TOOLS} 
        onToolPress={(id) => {
          onToolSelect(id);
          onClose();
        }} 
      />
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
});
```

- [ ] **Step 1.1.2: Commit**

```bash
git add src/features/editor/tool-sheet.tsx
git commit -m "feat(editor): add ToolSheet with 9-tool grid"
```

---

## Task 2: Crop Sheet

**Files:**
- Create: `src/features/editor/crop-sheet.tsx`

### Step 2.1: Implement CropSheet

- [ ] **Step 2.1.1: Create component**

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

export function CropSheet({ 
  visible, 
  initialCrop, 
  onApply, 
  onCancel,
}: CropSheetProps): React.JSX.Element {
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
    const isDefault = crop.x === 0 && crop.y === 0 && crop.width === 1 && crop.height === 1;
    onApply(isDefault ? null : crop);
  }, [crop, onApply]);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <Text style={styles.title}>TRANSFORM & CROP</Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.ratioRow}
      >
        {ASPECT_RATIOS.map((ratio) => (
          <Pressable
            key={ratio.label}
            style={[
              styles.ratioButton, 
              crop.aspectRatio === ratio.value && styles.ratioButtonActive,
            ]}
            onPress={() => handleRatioPress(ratio.value)}
          >
            <Text style={styles.ratioText}>{ratio.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sliderRow}>
        <Text style={styles.sliderLabel}>Straighten: {straighten}°</Text>
        <Slider 
          value={straighten} 
          minimumValue={-45} 
          maximumValue={45} 
          onValueChange={setStraighten} 
        />
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
  ratioRow: { 
    marginBottom: 16,
  },
  ratioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: tokens.colors.surfaceDark2,
  },
  ratioButtonActive: { 
    backgroundColor: tokens.colors.accent,
  },
  ratioText: { 
    color: tokens.colors.textPrimary, 
    fontSize: 14,
  },
  sliderRow: { 
    marginBottom: 16,
  },
  sliderLabel: { 
    color: tokens.colors.textSecondary, 
    fontSize: 12, 
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
});
```

- [ ] **Step 2.1.2: Commit**

```bash
git add src/features/editor/crop-sheet.tsx
git commit -m "feat(editor): add CropSheet"
```

---

## Task 3: Adjust Sheet

**Files:**
- Create: `src/features/editor/adjust-sheet.tsx`

### Step 3.1: Implement AdjustSheet

- [ ] **Step 3.1.1: Create component**

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

const SLIDERS = [
  { key: 'brightness' as const, label: 'Brightness', min: -1, max: 1 },
  { key: 'contrast' as const, label: 'Contrast', min: -1, max: 1 },
  { key: 'saturation' as const, label: 'Saturation', min: -1, max: 1 },
  { key: 'temperature' as const, label: 'Temperature', min: -1, max: 1 },
  { key: 'sharpen' as const, label: 'Sharpen', min: 0, max: 1 },
];

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
        {SLIDERS.map(({ key, label, min, max }) => (
          <View key={key} style={styles.sliderRow}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderLabel}>{label}</Text>
              <Text style={styles.sliderValue}>
                {Math.round(adjustments[key] * 100)}
              </Text>
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
  sliders: { 
    maxHeight: 300,
  },
  sliderRow: { 
    marginBottom: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderLabel: { 
    color: tokens.colors.textSecondary, 
    fontSize: 12,
  },
  sliderValue: { 
    color: tokens.colors.textPrimary, 
    fontSize: 12,
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
git add src/features/editor/adjust-sheet.tsx
git commit -m "feat(editor): add AdjustSheet"
```

---

## Task 4: LUT Picker Sheet

**Files:**
- Create: `src/features/editor/lut-picker-sheet.tsx`

### Step 4.1: Implement LUTPickerSheet

- [ ] **Step 4.1.1: Create component**

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

const CATEGORIES = [
  'Favorites', 
  'My LUTs', 
  'Lifestyle', 
  'Landscape', 
  'Nature', 
  'Portrait', 
  'Cinematic', 
  'B&W',
];

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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categories}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryTab, 
              activeCategory === cat && styles.categoryTabActive,
            ]}
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
            style={[
              styles.presetCard, 
              selectedPresetId === item.id && styles.presetCardSelected,
            ]}
            onPress={() => onSelectPreset(item.id)}
          >
            <Image 
              source={{ uri: item.thumbnailUri }} 
              style={styles.presetThumbnail} 
            />
            <Text style={styles.presetName} numberOfLines={1}>
              {item.name}
            </Text>
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
          onValueChange={onIntensityChange} 
        />
      </View>

      <View style={styles.actions}>
        <IconButton icon="close" onPress={onCancel} />
        <IconButton icon="check" onPress={onApply} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  categories: { 
    marginBottom: 12,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: tokens.colors.surfaceDark2,
  },
  categoryTabActive: { 
    backgroundColor: tokens.colors.accent,
  },
  categoryText: { 
    color: tokens.colors.textPrimary, 
    fontSize: 12,
  },
  importButton: {
    backgroundColor: tokens.colors.surfaceDark2,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  importText: { 
    color: tokens.colors.accent, 
    fontSize: 14, 
    fontWeight: '600',
  },
  importSubtext: { 
    color: tokens.colors.textSecondary, 
    fontSize: 11, 
    marginTop: 2,
  },
  grid: { 
    maxHeight: 200,
  },
  presetCard: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardSelected: { 
    borderColor: tokens.colors.accent,
  },
  presetThumbnail: { 
    width: '100%', 
    aspectRatio: 1,
  },
  presetName: { 
    color: tokens.colors.textSecondary, 
    fontSize: 10, 
    padding: 4,
  },
  intensityRow: { 
    marginTop: 12,
  },
  intensityLabel: { 
    color: tokens.colors.textSecondary, 
    fontSize: 12, 
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
git add src/features/editor/lut-picker-sheet.tsx
git commit -m "feat(editor): add LUTPickerSheet"
```

---

## Task 5: Modification Log Sheet

**Files:**
- Create: `src/features/editor/use-modification-log.ts`
- Create: `src/features/editor/modification-log-sheet.tsx`

### Step 5.1: Create useModificationLog hook

- [ ] **Step 5.1.1: Implement hook**

```typescript
// src/features/editor/use-modification-log.ts
import { useCallback, useRef } from 'react';
import type { EditAction } from '@core/edit-session/edit-action';
import type { AdjustmentParams } from '@core/edit-session/edit-state';

const MAX_HISTORY_STEPS = 50;
const COALESCE_WINDOW_MS = 300;

interface CoalesceState {
  lastActionType: string | null;
  lastTimestamp: number;
}

export function useModificationLog(
  dispatch: (action: { type: 'EDIT'; action: EditAction }) => void,
) {
  const coalesceRef = useRef<CoalesceState>({ 
    lastActionType: null, 
    lastTimestamp: 0,
  });

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

      coalesceRef.current = { 
        lastActionType: action.type, 
        lastTimestamp: now,
      };
    },
    [dispatch],
  );

  const commitAdjustment = useCallback(
    (adjustments: Partial<AdjustmentParams>) => {
      commitAction(
        { type: 'SET_ADJUSTMENTS', adjustments }, 
        { coalesce: true },
      );
    },
    [commitAction],
  );

  return { 
    commitAction, 
    commitAdjustment, 
    maxSteps: MAX_HISTORY_STEPS,
  };
}
```

- [ ] **Step 5.1.2: Commit**

```bash
git add src/features/editor/use-modification-log.ts
git commit -m "feat(editor): add useModificationLog with coalesced commits"
```

### Step 5.2: Create ModificationLogSheet

- [ ] **Step 5.2.1: Implement component**

```typescript
// src/features/editor/modification-log-sheet.tsx
import React from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';
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
}

function historyToEntries(history: History<EditState>): LogEntry[] {
  const entries: LogEntry[] = [];
  const allStates = [...history.past, history.present];

  allStates.forEach((state, index) => {
    if (index === 0) return;
    entries.push({
      index,
      label: getStepLabel(allStates[index - 1], state),
    });
  });

  return entries;
}

function getStepLabel(prev: EditState, curr: EditState): string {
  if (curr.crop !== prev.crop) return 'CROP';
  if (curr.rotation !== prev.rotation) return 'ROTATE';
  if (curr.selectedPresetId !== prev.selectedPresetId) {
    return `LUT: ${curr.selectedPresetId ?? 'None'}`;
  }
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
              <IconButton 
                icon="visibility" 
                onPress={() => onPreviewStep(item.index)} 
              />
              <View style={styles.entryInfo}>
                <Text style={styles.entryLabel}>
                  #{item.index} {item.label}
                </Text>
              </View>
              <IconButton 
                icon="close" 
                onPress={() => onDeleteStep(item.index)} 
              />
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
  title: { 
    color: tokens.colors.textPrimary, 
    fontSize: 14, 
    fontWeight: '600',
  },
  stepCount: { 
    color: tokens.colors.textSecondary, 
    fontSize: 12,
  },
  emptyText: { 
    color: tokens.colors.textSecondary, 
    textAlign: 'center', 
    paddingVertical: 24,
  },
  list: { 
    maxHeight: 300,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.surfaceDark2,
  },
  entryInfo: { 
    flex: 1, 
    marginHorizontal: 8,
  },
  entryLabel: { 
    color: tokens.colors.textPrimary, 
    fontSize: 14,
  },
});
```

- [ ] **Step 5.2.2: Commit**

```bash
git add src/features/editor/modification-log-sheet.tsx
git commit -m "feat(editor): add ModificationLogSheet"
```

---

## Task 6: Export Sheet

**Files:**
- Create: `src/features/editor/export-sheet.tsx`

### Step 6.1: Implement ExportSheet

- [ ] **Step 6.1.1: Create component**

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

export function ExportSheet({ 
  visible, 
  onExport, 
  onClose,
}: ExportSheetProps): React.JSX.Element {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = useCallback(
    async (format: 'jpeg' | 'png') => {
      setStatus('exporting');
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
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  if (status === 'exporting') {
    return (
      <BottomSheet visible={visible} onClose={() => {}}>
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color={tokens.colors.accent} />
          <Text style={styles.statusText}>EXPORTING...</Text>
        </View>
      </BottomSheet>
    );
  }

  if (status === 'success') {
    return (
      <BottomSheet visible={visible} onClose={handleClose}>
        <View style={styles.statusContainer}>
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
        <View style={styles.statusContainer}>
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
  formatIconText: { 
    color: tokens.colors.textPrimary, 
    fontSize: 12, 
    fontWeight: '600',
  },
  formatInfo: { 
    flex: 1,
  },
  formatTitle: { 
    color: tokens.colors.textPrimary, 
    fontSize: 14,
  },
  statusContainer: { 
    alignItems: 'center', 
    paddingVertical: 32,
  },
  statusText: { 
    color: tokens.colors.textPrimary, 
    marginTop: 16,
  },
  successText: { 
    color: tokens.colors.textPrimary, 
    fontSize: 16, 
    marginTop: 16,
  },
  errorText: { 
    color: tokens.colors.error, 
    fontSize: 14, 
    marginTop: 16, 
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: tokens.colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 980,
    marginTop: 24,
  },
  doneButtonText: { 
    color: tokens.colors.textPrimary, 
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: tokens.colors.surfaceDark2,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 980,
    marginTop: 24,
  },
  retryButtonText: { 
    color: tokens.colors.textPrimary,
  },
});
```

- [ ] **Step 6.1.2: Commit**

```bash
git add src/features/editor/export-sheet.tsx
git commit -m "feat(editor): add ExportSheet with progress and error states"
```

---

## Completion Checklist

- [ ] ToolSheet shows 9-tool grid (Phase 1 tools enabled, Phase 2/3 disabled)
- [ ] CropSheet with aspect ratio presets and straighten slider
- [ ] AdjustSheet with 5 sliders and live preview
- [ ] LUTPickerSheet with categories and intensity
- [ ] ModificationLogSheet shows history steps
- [ ] ExportSheet with PNG/JPEG options and progress states
- [ ] useModificationLog coalesces rapid slider changes

**Next:** Phase 1F - Settings + Integration
