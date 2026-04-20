# Phase 1D: Editor Shell

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add bottom toolbar and glass-effect tool panel to Editor screen.

**Architecture:** ToolPanel component with BlurView, 7-item toolbar (Tools, Crop, Adjust, LUT, Log, Undo, Redo).

**Tech Stack:** React Native, expo-blur, TypeScript

**Estimated context:** ~25K tokens

**Prerequisites:** Phase 1C (Home Screen) complete

---

## File Structure

### New Files
| Path | Responsibility |
|------|----------------|
| `src/ui/layout/tool-panel.tsx` | Glass background panel |
| `src/ui/composite/tool-grid.tsx` | 4-column tool icon grid |

### Modified Files
| Path | Changes |
|------|---------|
| `src/features/editor/editor.screen.tsx` | Add bottom toolbar |
| `src/ui/layout/index.ts` | Export ToolPanel |

---

## Task 1: ToolPanel Component

**Files:**
- Create: `src/ui/layout/tool-panel.tsx`

### Step 1.1: Implement ToolPanel

- [ ] **Step 1.1.1: Create component**

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
    paddingBottom: 24, // Safe area padding
  },
});
```

- [ ] **Step 1.1.2: Update barrel export**

```typescript
// Add to src/ui/layout/index.ts
export { ToolPanel } from './tool-panel';
```

- [ ] **Step 1.1.3: Commit**

```bash
git add src/ui/layout/tool-panel.tsx src/ui/layout/index.ts
git commit -m "feat(ui): add ToolPanel with glass effect"
```

---

## Task 2: ToolGrid Component

**Files:**
- Create: `src/ui/composite/tool-grid.tsx`

### Step 2.1: Implement ToolGrid

- [ ] **Step 2.1.1: Create component**

```typescript
// src/ui/composite/tool-grid.tsx
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@ui/primitives/text';
import { IconButton } from '@ui/primitives/icon-button';
import { tokens } from '@theme/tokens';

export interface ToolItem {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly disabled?: boolean;
}

interface ToolGridProps {
  readonly tools: readonly ToolItem[];
  readonly onToolPress: (toolId: string) => void;
  readonly columns?: number;
}

export function ToolGrid({ 
  tools, 
  onToolPress,
  columns = 4,
}: ToolGridProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {tools.map((tool) => (
        <Pressable
          key={tool.id}
          style={[styles.toolItem, { width: `${100 / columns}%` }]}
          onPress={() => onToolPress(tool.id)}
          disabled={tool.disabled}
        >
          <View style={[styles.iconContainer, tool.disabled && styles.disabled]}>
            <IconButton 
              icon={tool.icon} 
              size={24} 
              disabled={tool.disabled}
            />
          </View>
          <Text style={[styles.label, tool.disabled && styles.labelDisabled]}>
            {tool.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  toolItem: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: tokens.colors.surfaceDark2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: tokens.colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  labelDisabled: {
    opacity: 0.4,
  },
});
```

- [ ] **Step 2.1.2: Create/update barrel**

```typescript
// src/ui/composite/index.ts
export { ToolGrid, type ToolItem } from './tool-grid';
```

- [ ] **Step 2.1.3: Commit**

```bash
git add src/ui/composite/
git commit -m "feat(ui): add ToolGrid component"
```

---

## Task 3: Editor Bottom Toolbar

**Files:**
- Modify: `src/features/editor/editor.screen.tsx`

### Step 3.1: Add toolbar to EditorScreen

- [ ] **Step 3.1.1: Update EditorScreen**

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
import { tokens } from '@theme/tokens';

type SheetType = 'tools' | 'crop' | 'adjust' | 'lut' | 'log' | 'export' | null;

export function EditorScreen(): React.JSX.Element {
  const { assetId, draft } = useLocalSearchParams<{ assetId: string; draft?: string }>();
  const router = useRouter();
  const { state, dispatch, canUndo, canRedo } = useEditorSession(
    assetId ?? '',
    draft === 'true',
  );
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);

  const handleClose = useCallback(() => {
    // TODO: Auto-save draft in Phase 1E
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

  const handleToolbarPress = useCallback((toolId: string) => {
    setActiveSheet(toolId as SheetType);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <IconButton icon="close" onPress={handleClose} />
        <Pressable style={styles.exportButton} onPress={handleExport}>
          <Text style={styles.exportText}>EXPORT</Text>
        </Pressable>
      </View>

      {/* Canvas */}
      <View style={styles.canvas}>
        <PreviewCanvas editState={state.history.present} />
      </View>

      {/* Bottom Toolbar */}
      <ToolPanel>
        <View style={styles.toolbar}>
          <IconButton 
            icon="apps" 
            label="Tools" 
            onPress={() => handleToolbarPress('tools')} 
          />
          <IconButton 
            icon="crop" 
            label="Crop" 
            onPress={() => handleToolbarPress('crop')} 
          />
          <IconButton 
            icon="tune" 
            label="Adjust" 
            onPress={() => handleToolbarPress('adjust')} 
          />
          <IconButton 
            icon="palette" 
            label="LUT" 
            onPress={() => handleToolbarPress('lut')} 
          />
          <IconButton 
            icon="history" 
            label="Log" 
            onPress={() => handleToolbarPress('log')} 
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

      {/* Sheets will be added in Phase 1E */}
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

- [ ] **Step 3.1.2: Commit**

```bash
git add src/features/editor/editor.screen.tsx
git commit -m "feat(editor): add bottom toolbar with 7 items"
```

---

## Completion Checklist

- [ ] ToolPanel renders with glass effect
- [ ] ToolGrid displays tools in 4-column layout
- [ ] Editor has top bar with Close and Export
- [ ] Editor has bottom toolbar with 7 items
- [ ] Undo/Redo buttons show disabled state correctly

**Next:** Phase 1E - Tool Sheets
