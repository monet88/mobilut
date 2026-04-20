# Phase 2D: Stylistic Integration

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Wire Phase 2 tools to EditState, reducer, and tool grid. Enable tools in editor.

**Architecture:** Add fields to EditState, handle new actions in reducer, enable tools in grid.

**Tech Stack:** TypeScript, React

**Estimated context:** ~25K tokens

**Prerequisites:** Phase 2A, 2B, 2C complete

**Repo alignment notes:**
- Keep this work inside the existing `src/features/editor` / `src/core/edit-session` surface area from Phase 1.
- Put the Phase 2 integration test under `__tests__/features/` instead of `src/features/editor/`.

---

## File Structure

### Modified Files
| Path | Changes |
|------|---------|
| `src/core/edit-session/edit-state.ts` | Add Phase 2 fields |
| `src/core/edit-session/edit-action.ts` | Add Phase 2 actions |
| `src/features/editor/editor-reducer.ts` | Handle Phase 2 actions |
| `src/features/editor/tool-sheet.tsx` | Enable Phase 2 tools |
| `src/features/editor/editor.screen.tsx` | Wire Phase 2 sheets |
| `src/core/stylistic/index.ts` | Create barrel export |

---

## Task 1: Update EditState

### Step 1.1: Add Phase 2 fields

- [ ] **Step 1.1.1: Update edit-state.ts**

```typescript
// Add imports at top of src/core/edit-session/edit-state.ts
import type { ArtisticLookParams } from '@core/stylistic/artistic-look-model';
import type { SmartFilterParams } from '@core/stylistic/smart-filter-model';
import type { ProClarityParams } from '@core/stylistic/pro-clarity-model';

// Add to EditState interface (after watermark):
readonly artisticLook: ArtisticLookParams | null;
readonly smartFilter: SmartFilterParams | null;
readonly proClarity: ProClarityParams | null;

// Update createInitialEditState return (add after watermark: null):
artisticLook: null,
smartFilter: null,
proClarity: null,
```

- [ ] **Step 1.1.2: Commit**

```bash
git add src/core/edit-session/edit-state.ts
git commit -m "feat(edit-session): add Phase 2 tool fields to EditState"
```

---

## Task 2: Update EditAction

### Step 2.1: Add Phase 2 actions

- [ ] **Step 2.1.1: Update edit-action.ts**

```typescript
// Add imports at top of src/core/edit-session/edit-action.ts
import type { ArtisticLookParams } from '@core/stylistic/artistic-look-model';
import type { SmartFilterParams } from '@core/stylistic/smart-filter-model';
import type { ProClarityParams } from '@core/stylistic/pro-clarity-model';

// Add to EditAction union type:
| { readonly type: 'SET_ARTISTIC_LOOK'; readonly params: ArtisticLookParams }
| { readonly type: 'CLEAR_ARTISTIC_LOOK' }
| { readonly type: 'SET_SMART_FILTER'; readonly params: SmartFilterParams }
| { readonly type: 'CLEAR_SMART_FILTER' }
| { readonly type: 'SET_PRO_CLARITY'; readonly params: ProClarityParams }
| { readonly type: 'CLEAR_PRO_CLARITY' }
```

- [ ] **Step 2.1.2: Commit**

```bash
git add src/core/edit-session/edit-action.ts
git commit -m "feat(edit-session): add Phase 2 EditActions"
```

---

## Task 3: Update Reducer

### Step 3.1: Handle Phase 2 actions

- [ ] **Step 3.1.1: Update editor-reducer.ts**

```typescript
// Add cases to applyEditAction function in src/features/editor/editor-reducer.ts

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

- [ ] **Step 3.1.2: Commit**

```bash
git add src/features/editor/editor-reducer.ts
git commit -m "feat(editor): handle Phase 2 actions in reducer"
```

---

## Task 4: Create Stylistic Barrel Export

### Step 4.1: Create index.ts

- [ ] **Step 4.1.1: Create barrel**

```typescript
// src/core/stylistic/index.ts
export type { 
  ArtisticLookParams, 
  ArtisticLookStyle,
} from './artistic-look-model';
export { 
  ARTISTIC_LOOK_STYLES, 
  getArtisticLookById,
  getStylesByFamily,
} from './artistic-look-model';

export type { 
  SmartFilterParams, 
  ImageAnalysis, 
  SmartFilterCorrection,
} from './smart-filter-model';
export { 
  computeSmartFilterCorrection,
  DEFAULT_SMART_FILTER,
} from './smart-filter-model';

export type { ProClarityParams } from './pro-clarity-model';
export { 
  DEFAULT_PRO_CLARITY, 
  hasProClarityApplied,
  clampProClarityParams,
} from './pro-clarity-model';
```

- [ ] **Step 4.1.2: Commit**

```bash
git add src/core/stylistic/index.ts
git commit -m "feat(stylistic): add barrel exports"
```

---

## Task 5: Enable Tools in Grid

### Step 5.1: Update ToolSheet

- [ ] **Step 5.1.1: Enable Phase 2 tools**

```typescript
// Update TOOLS array in src/features/editor/tool-sheet.tsx
const TOOLS: ToolItem[] = [
  { id: 'crop', icon: 'crop', label: 'Crop' },
  { id: 'adjust', icon: 'tune', label: 'Adjust' },
  { id: 'lut', icon: 'palette', label: 'LUT' },
  { id: 'smart-filter', icon: 'auto-fix', label: 'Smart' },      // Remove disabled
  { id: 'pro-clarity', icon: 'hdr-strong', label: 'Pro' },       // Remove disabled
  { id: 'artistic-look', icon: 'brush', label: 'Artistic' },     // Remove disabled
  { id: 'border', icon: 'crop-square', label: 'Border' },
  { id: 'blend', icon: 'layers', label: 'Blend', disabled: true }, // Still disabled
  { id: 'frame', icon: 'filter-frames', label: 'Frame' },
];
```

- [ ] **Step 5.1.2: Commit**

```bash
git add src/features/editor/tool-sheet.tsx
git commit -m "feat(editor): enable Phase 2 tools in grid"
```

---

## Task 6: Wire Sheets to Editor

### Step 6.1: Update EditorScreen

- [ ] **Step 6.1.1: Add imports and state**

```typescript
// Add to imports in src/features/editor/editor.screen.tsx
import { ArtisticLookSheet } from './artistic-look-sheet';
import { SmartFilterSheet } from './smart-filter-sheet';
import { ProClaritySheet } from './pro-clarity-sheet';
import type { ArtisticLookParams } from '@core/stylistic/artistic-look-model';
import type { SmartFilterParams } from '@core/stylistic/smart-filter-model';
import type { ProClarityParams } from '@core/stylistic/pro-clarity-model';

// Update SheetType
type SheetType = 
  | 'tools' | 'crop' | 'adjust' | 'lut' | 'log' | 'export' 
  | 'border' | 'frame'
  | 'artistic-look' | 'smart-filter' | 'pro-clarity'  // Add Phase 2
  | null;
```

- [ ] **Step 6.1.2: Add handlers**

```typescript
// Add handlers in EditorScreen component

const handleArtisticLookApply = useCallback((params: ArtisticLookParams | null) => {
  if (params) {
    commitAction({ type: 'SET_ARTISTIC_LOOK', params });
  } else {
    commitAction({ type: 'CLEAR_ARTISTIC_LOOK' });
  }
  setActiveSheet(null);
}, [commitAction]);

const handleArtisticLookPreview = useCallback((params: ArtisticLookParams | null) => {
  // Live preview - could use a separate preview state
}, []);

const handleSmartFilterApply = useCallback((params: SmartFilterParams | null) => {
  if (params) {
    commitAction({ type: 'SET_SMART_FILTER', params });
  } else {
    commitAction({ type: 'CLEAR_SMART_FILTER' });
  }
  setActiveSheet(null);
}, [commitAction]);

const handleSmartFilterPreview = useCallback((params: SmartFilterParams | null) => {
  // Live preview
}, []);

const handleProClarityApply = useCallback((params: ProClarityParams | null) => {
  if (params) {
    commitAction({ type: 'SET_PRO_CLARITY', params });
  } else {
    commitAction({ type: 'CLEAR_PRO_CLARITY' });
  }
  setActiveSheet(null);
}, [commitAction]);

const handleProClarityPreview = useCallback((params: ProClarityParams | null) => {
  // Live preview
}, []);
```

- [ ] **Step 6.1.3: Add sheet components**

```typescript
// Add to JSX after existing sheets

<ArtisticLookSheet
  visible={activeSheet === 'artistic-look'}
  initialParams={editState.artisticLook}
  onApply={handleArtisticLookApply}
  onCancel={closeSheet}
  onPreview={handleArtisticLookPreview}
/>

<SmartFilterSheet
  visible={activeSheet === 'smart-filter'}
  initialParams={editState.smartFilter}
  onApply={handleSmartFilterApply}
  onCancel={closeSheet}
  onPreview={handleSmartFilterPreview}
/>

<ProClaritySheet
  visible={activeSheet === 'pro-clarity'}
  initialParams={editState.proClarity}
  onApply={handleProClarityApply}
  onCancel={closeSheet}
  onPreview={handleProClarityPreview}
/>
```

- [ ] **Step 6.1.4: Commit**

```bash
git add src/features/editor/editor.screen.tsx
git commit -m "feat(editor): wire Phase 2 sheets to EditorScreen"
```

---

## Task 7: Integration Tests

### Step 7.1: Add Phase 2 tests

- [ ] **Step 7.1.1: Create test file**

```typescript
// __tests__/features/editor.phase-2-tools.test.tsx
import { describe, it, expect } from '@jest/globals';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EditorScreen } from '@features/editor';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ assetId: 'test-asset' }),
  useRouter: () => ({ back: jest.fn() }),
}));

describe('Phase 2 Tools', () => {
  it('opens Artistic Look sheet from Tools grid', async () => {
    const { getByLabelText, getByText } = render(<EditorScreen />);

    fireEvent.press(getByLabelText('Tools'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Artistic'));
    });

    await waitFor(() => {
      expect(getByText('ARTISTIC LOOK')).toBeTruthy();
    });
  });

  it('opens Smart Filter sheet from Tools grid', async () => {
    const { getByLabelText, getByText } = render(<EditorScreen />);

    fireEvent.press(getByLabelText('Tools'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Smart'));
    });

    await waitFor(() => {
      expect(getByText('SMART FILTER')).toBeTruthy();
    });
  });

  it('opens Pro Clarity sheet from Tools grid', async () => {
    const { getByLabelText, getByText } = render(<EditorScreen />);

    fireEvent.press(getByLabelText('Tools'));
    
    await waitFor(() => {
      fireEvent.press(getByText('Pro'));
    });

    await waitFor(() => {
      expect(getByText('PRO CLARITY')).toBeTruthy();
    });
  });
});
```

- [ ] **Step 7.1.2: Run tests**

```bash
npm test -- --testPathPattern=phase-2-tools
```
Expected: PASS

- [ ] **Step 7.1.3: Commit**

```bash
git add __tests__/features/editor.phase-2-tools.test.tsx
git commit -m "test(editor): add Phase 2 tools integration tests"
```

---

## Task 8: Final Verification

### Step 8.1: Run full test suite

- [ ] **Step 8.1.1: Run all tests**

```bash
npm test
```
Expected: All tests pass

### Step 8.2: Manual QA

- [ ] **Step 8.2.1: Test Artistic Look**
  - Open Tools > Artistic
  - Switch between families
  - Select style, adjust intensity
  - Apply and verify in preview

- [ ] **Step 8.2.2: Test Smart Filter**
  - Open Tools > Smart
  - Toggle on, adjust strength
  - Verify auto-corrections apply

- [ ] **Step 8.2.3: Test Pro Clarity**
  - Open Tools > Pro
  - Adjust all 4 sliders
  - Verify sharpening visible

### Step 8.3: Final commit

- [ ] **Step 8.3.1: Commit**

```bash
git add .
git commit -m "$(cat <<'EOF'
feat: complete Phase 2 - Stylistic Tools

- Artistic Look with 7 preset styles across 5 families
- Smart Filter with deterministic auto-enhance
- Pro Clarity with clarity/sharpness/structure/microContrast
- All tools wired to EditState and reducer
- Integration tests for Phase 2 tools
EOF
)"
```

---

## Completion Checklist

- [ ] EditState has Phase 2 fields
- [ ] Reducer handles Phase 2 actions
- [ ] Tools enabled in grid (except Blend)
- [ ] All sheets wired to EditorScreen
- [ ] Integration tests pass

**Phase 2 Complete!**

**Next:** Phase 3A - Batch Core
