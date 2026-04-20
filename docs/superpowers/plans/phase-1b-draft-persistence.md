# Phase 1B: Draft Persistence

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Create file-based draft repository with hydration and resume contracts.

**Architecture:** Drafts stored as JSON files in app documents directory. Hydration validates asset existence before loading.

**Tech Stack:** TypeScript, expo-file-system

**Estimated context:** ~35K tokens

**Prerequisites:** Phase 1A (Render Parity) complete

---

## File Structure

### New Files
| Path | Responsibility |
|------|----------------|
| `src/core/draft/draft-model.ts` | Draft type definitions |
| `src/core/draft/index.ts` | Barrel export |
| `src/services/draft/draft-repository.ts` | File-based draft CRUD |
| `src/services/draft/draft-repository.test.ts` | Repository tests |
| `src/services/draft/draft-hydration.ts` | Session hydration |
| `src/services/draft/draft-hydration.test.ts` | Hydration tests |
| `src/services/draft/index.ts` | Barrel export |

---

## Task 1: Draft Model

**Files:**
- Create: `src/core/draft/draft-model.ts`
- Create: `src/core/draft/index.ts`

### Step 1.1: Define draft types

- [ ] **Step 1.1.1: Create draft model**

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

export function createDraftMetadata(id: string, previewUri: string | null = null): DraftMetadata {
  const now = Date.now();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    previewUri,
  };
}
```

- [ ] **Step 1.1.2: Create barrel export**

```typescript
// src/core/draft/index.ts
export type { Draft, DraftMetadata, HistoryStepMeta } from './draft-model';
export { createDraftId, createDraftMetadata } from './draft-model';
```

- [ ] **Step 1.1.3: Commit**

```bash
git add src/core/draft/
git commit -m "feat(draft): add draft model types"
```

---

## Task 2: Draft Repository

**Files:**
- Create: `src/services/draft/draft-repository.ts`
- Create: `src/services/draft/draft-repository.test.ts`

### Step 2.1: Write repository tests

- [ ] **Step 2.1.1: Create test file**

```typescript
// src/services/draft/draft-repository.test.ts
import { describe, it, expect, afterEach } from '@jest/globals';
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

  it('returns null for non-existent draft', async () => {
    const loaded = await loadDraft('nonexistent');
    expect(loaded).toBeNull();
  });

  it('lists all drafts sorted by updatedAt', async () => {
    await saveDraft(testDraft);
    const drafts = await listDrafts();

    expect(drafts.length).toBeGreaterThanOrEqual(1);
    expect(drafts.some(d => d.id === 'test-draft-1')).toBe(true);
  });

  it('deletes a draft', async () => {
    await saveDraft(testDraft);
    await deleteDraft('test-draft-1');
    const loaded = await loadDraft('test-draft-1');

    expect(loaded).toBeNull();
  });
});
```

- [ ] **Step 2.1.2: Run test**

```bash
npm test -- --testPathPattern=draft-repository
```
Expected: FAIL

### Step 2.2: Implement repository

- [ ] **Step 2.2.1: Create draft repository**

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

  try {
    const content = await FileSystem.readAsStringAsync(draftPath);
    return JSON.parse(content) as Draft;
  } catch {
    return null;
  }
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

export async function updateDraftPreview(draftId: string, previewUri: string): Promise<void> {
  const draft = await loadDraft(draftId);
  if (!draft) return;

  const previewPath = `${DRAFTS_DIR}${draftId}/preview.jpg`;
  await FileSystem.copyAsync({ from: previewUri, to: previewPath });

  const updated: Draft = {
    ...draft,
    metadata: {
      ...draft.metadata,
      previewUri: previewPath,
      updatedAt: Date.now(),
    },
  };

  await saveDraft(updated);
}
```

- [ ] **Step 2.2.2: Run test**

```bash
npm test -- --testPathPattern=draft-repository
```
Expected: PASS

- [ ] **Step 2.2.3: Commit**

```bash
git add src/services/draft/draft-repository.ts src/services/draft/draft-repository.test.ts
git commit -m "feat(draft): add file-based draft repository"
```

---

## Task 3: Draft Hydration

**Files:**
- Create: `src/services/draft/draft-hydration.ts`
- Create: `src/services/draft/draft-hydration.test.ts`

### Step 3.1: Write hydration tests

- [ ] **Step 3.1.1: Create test file**

```typescript
// src/services/draft/draft-hydration.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { hydrateDraft, HydrationError } from './draft-hydration';
import { saveDraft, deleteDraft } from './draft-repository';
import { createInitialEditState } from '@core/edit-session/edit-state';
import type { Draft } from '@core/draft';

describe('hydrateDraft', () => {
  const testDraft: Draft = {
    metadata: {
      id: 'hydrate-test',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      previewUri: null,
    },
    editState: createInitialEditState('asset-1', 'file:///test.jpg', 1920, 1080),
    historyMetadata: [],
  };

  beforeEach(async () => {
    await saveDraft(testDraft);
  });

  afterEach(async () => {
    await deleteDraft('hydrate-test');
  });

  it('returns hydrated session for valid draft', async () => {
    const result = await hydrateDraft('hydrate-test');

    expect(result.draftId).toBe('hydrate-test');
    expect(result.editState.assetId).toBe('asset-1');
  });

  it('throws DRAFT_NOT_FOUND for missing draft', async () => {
    await expect(hydrateDraft('nonexistent')).rejects.toThrow(HydrationError);
    
    try {
      await hydrateDraft('nonexistent');
    } catch (error) {
      expect((error as HydrationError).code).toBe('DRAFT_NOT_FOUND');
    }
  });
});
```

- [ ] **Step 3.1.2: Run test**

```bash
npm test -- --testPathPattern=draft-hydration
```
Expected: FAIL

### Step 3.2: Implement hydration

- [ ] **Step 3.2.1: Create hydration service**

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

  // Validate asset still exists
  const assetInfo = await FileSystem.getInfoAsync(draft.editState.assetUri);
  if (!assetInfo.exists) {
    throw new HydrationError(
      `Asset missing: ${draft.editState.assetUri}`,
      'ASSET_MISSING',
    );
  }

  return {
    draftId,
    editState: draft.editState,
    history: {
      past: [],
      present: draft.editState,
      future: [],
    },
  };
}

export async function canHydrateDraft(draftId: string): Promise<boolean> {
  try {
    await hydrateDraft(draftId);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 3.2.2: Run test**

```bash
npm test -- --testPathPattern=draft-hydration
```
Expected: PASS

- [ ] **Step 3.2.3: Commit**

```bash
git add src/services/draft/draft-hydration.ts src/services/draft/draft-hydration.test.ts
git commit -m "feat(draft): add session hydration with asset validation"
```

---

## Task 4: Barrel Export and Integration

**Files:**
- Create: `src/services/draft/index.ts`

### Step 4.1: Create barrel export

- [ ] **Step 4.1.1: Create index**

```typescript
// src/services/draft/index.ts
export { 
  saveDraft, 
  loadDraft, 
  listDrafts, 
  deleteDraft,
  updateDraftPreview,
} from './draft-repository';

export { 
  hydrateDraft, 
  canHydrateDraft,
  HydrationError, 
  type HydratedSession,
} from './draft-hydration';
```

- [ ] **Step 4.1.2: Commit**

```bash
git add src/services/draft/index.ts
git commit -m "feat(draft): add barrel exports"
```

---

## Completion Checklist

- [ ] All tests pass: `npm test -- --testPathPattern=draft`
- [ ] Draft model types defined
- [ ] saveDraft, loadDraft, listDrafts, deleteDraft working
- [ ] hydrateDraft validates asset existence
- [ ] HydrationError with proper error codes

**Next:** Phase 1C - Home Screen
