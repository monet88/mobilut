# Phase 3B: Batch Export

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add batch export queue with progress tracking and error handling.

**Architecture:** Export queue processes items sequentially, tracks progress, handles failures gracefully.

**Tech Stack:** TypeScript, expo-file-system, expo-media-library

**Estimated context:** ~25K tokens

**Prerequisites:** Phase 3A complete

---

## File Structure

### New Files
| Path | Responsibility |
|------|----------------|
| `src/core/batch/batch-export-model.ts` | Export job types |
| `src/services/batch/batch-export.service.ts` | Export queue orchestration |

### Modified Files
| Path | Changes |
|------|---------|
| `src/core/batch/index.ts` | Add export model exports |
| `src/services/batch/index.ts` | Add export service exports |

---

## Task 1: Batch Export Model

### Step 1.1: Create export types

- [ ] **Step 1.1.1: Create model file**

```typescript
// src/core/batch/batch-export-model.ts
export interface BatchExportJob {
  readonly id: string;
  readonly workspaceId: string;
  readonly status: BatchExportStatus;
  readonly progress: BatchExportProgress;
  readonly settings: BatchExportSettings;
  readonly startedAt: number | null;
  readonly completedAt: number | null;
}

export type BatchExportStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled';

export interface BatchExportProgress {
  readonly total: number;
  readonly completed: number;
  readonly failed: number;
  readonly currentItemId: string | null;
}

export interface BatchExportSettings {
  readonly format: 'jpeg' | 'png';
  readonly quality: number;
  readonly maxDimension: number | null;
  readonly saveToGallery: boolean;
  readonly outputDirectory: string | null;
}

export const DEFAULT_BATCH_EXPORT_SETTINGS: BatchExportSettings = Object.freeze({
  format: 'jpeg',
  quality: 0.92,
  maxDimension: null,
  saveToGallery: true,
  outputDirectory: null,
});

export function createBatchExportJob(
  workspaceId: string,
  totalItems: number,
  settings: Partial<BatchExportSettings> = {},
): BatchExportJob {
  return {
    id: `export-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    workspaceId,
    status: 'idle',
    progress: {
      total: totalItems,
      completed: 0,
      failed: 0,
      currentItemId: null,
    },
    settings: { ...DEFAULT_BATCH_EXPORT_SETTINGS, ...settings },
    startedAt: null,
    completedAt: null,
  };
}

export function getExportPercentage(job: BatchExportJob): number {
  if (job.progress.total === 0) return 0;
  return Math.round((job.progress.completed / job.progress.total) * 100);
}

export function isExportComplete(job: BatchExportJob): boolean {
  return job.progress.completed + job.progress.failed >= job.progress.total;
}
```

- [ ] **Step 1.1.2: Add test**

```typescript
// src/core/batch/batch-export-model.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  createBatchExportJob,
  getExportPercentage,
  isExportComplete,
  DEFAULT_BATCH_EXPORT_SETTINGS,
} from './batch-export-model';

describe('batch-export-model', () => {
  it('creates export job with idle status', () => {
    const job = createBatchExportJob('workspace-1', 10);

    expect(job.workspaceId).toBe('workspace-1');
    expect(job.status).toBe('idle');
    expect(job.progress.total).toBe(10);
    expect(job.progress.completed).toBe(0);
  });

  it('uses default settings', () => {
    const job = createBatchExportJob('w1', 5);

    expect(job.settings.format).toBe('jpeg');
    expect(job.settings.quality).toBe(0.92);
    expect(job.settings.saveToGallery).toBe(true);
  });

  it('allows custom settings override', () => {
    const job = createBatchExportJob('w1', 5, { format: 'png', quality: 1.0 });

    expect(job.settings.format).toBe('png');
    expect(job.settings.quality).toBe(1.0);
    expect(job.settings.saveToGallery).toBe(true);
  });

  it('calculates export percentage', () => {
    const job = createBatchExportJob('w1', 10);
    const updatedJob = {
      ...job,
      progress: { ...job.progress, completed: 3 },
    };

    expect(getExportPercentage(updatedJob)).toBe(30);
  });

  it('detects export completion', () => {
    const job = createBatchExportJob('w1', 3);
    
    expect(isExportComplete(job)).toBe(false);

    const completedJob = {
      ...job,
      progress: { ...job.progress, completed: 2, failed: 1 },
    };
    expect(isExportComplete(completedJob)).toBe(true);
  });
});
```

- [ ] **Step 1.1.3: Run test**

```bash
npm test -- --testPathPattern=batch-export-model
```
Expected: PASS

- [ ] **Step 1.1.4: Commit**

```bash
git add src/core/batch/batch-export-model.ts src/core/batch/batch-export-model.test.ts
git commit -m "feat(batch): add BatchExportJob model"
```

---

## Task 2: Batch Export Service

### Step 2.1: Create export service

- [ ] **Step 2.1.1: Implement service**

```typescript
// src/services/batch/batch-export.service.ts
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import type { BatchWorkspace, BatchItem } from '@core/batch/batch-model';
import type {
  BatchExportJob,
  BatchExportProgress,
  BatchExportSettings,
} from '@core/batch/batch-export-model';
import { createBatchExportJob, isExportComplete } from '@core/batch/batch-export-model';
import { getAllReadyItems } from '@core/batch/batch-workspace';
import { exportImage } from '@services/image/export-render.service';

export type ExportProgressCallback = (job: BatchExportJob) => void;
export type ExportItemCallback = (itemId: string, success: boolean, uri?: string, error?: string) => void;

interface ExportController {
  cancel: () => void;
  pause: () => void;
  resume: () => void;
}

let currentController: ExportController | null = null;

export async function startBatchExport(
  workspace: BatchWorkspace,
  settings: Partial<BatchExportSettings>,
  onProgress: ExportProgressCallback,
  onItemComplete: ExportItemCallback,
): Promise<BatchExportJob> {
  const readyItems = getAllReadyItems(workspace);
  
  if (readyItems.length === 0) {
    throw new Error('No items ready for export');
  }

  let job = createBatchExportJob(workspace.id, readyItems.length, settings);
  job = { ...job, status: 'running', startedAt: Date.now() };
  onProgress(job);

  let cancelled = false;
  let paused = false;

  currentController = {
    cancel: () => { cancelled = true; },
    pause: () => { paused = true; },
    resume: () => { paused = false; },
  };

  for (const item of readyItems) {
    if (cancelled) {
      job = { ...job, status: 'cancelled', completedAt: Date.now() };
      onProgress(job);
      break;
    }

    while (paused && !cancelled) {
      await sleep(100);
    }

    job = updateJobProgress(job, { currentItemId: item.id });
    onProgress(job);

    try {
      const exportedUri = await exportSingleItem(item, job.settings);
      
      job = updateJobProgress(job, {
        completed: job.progress.completed + 1,
        currentItemId: null,
      });
      onItemComplete(item.id, true, exportedUri);
    } catch (error) {
      job = updateJobProgress(job, {
        failed: job.progress.failed + 1,
        currentItemId: null,
      });
      onItemComplete(item.id, false, undefined, String(error));
    }

    onProgress(job);
  }

  if (isExportComplete(job) && job.status === 'running') {
    job = { ...job, status: 'completed', completedAt: Date.now() };
    onProgress(job);
  }

  currentController = null;
  return job;
}

async function exportSingleItem(
  item: BatchItem,
  settings: BatchExportSettings,
): Promise<string> {
  if (!item.editState) {
    throw new Error('Item has no edit state');
  }

  const outputUri = await exportImage({
    sourceUri: item.uri,
    sourceWidth: item.width,
    sourceHeight: item.height,
    editState: item.editState,
    format: settings.format,
    quality: settings.quality,
    maxDimension: settings.maxDimension ?? undefined,
  });

  if (settings.saveToGallery) {
    await MediaLibrary.saveToLibraryAsync(outputUri);
  }

  return outputUri;
}

function updateJobProgress(
  job: BatchExportJob,
  progressUpdate: Partial<BatchExportProgress>,
): BatchExportJob {
  return {
    ...job,
    progress: { ...job.progress, ...progressUpdate },
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function cancelBatchExport(): void {
  currentController?.cancel();
}

export function pauseBatchExport(): void {
  currentController?.pause();
}

export function resumeBatchExport(): void {
  currentController?.resume();
}

export function isBatchExportRunning(): boolean {
  return currentController !== null;
}
```

- [ ] **Step 2.1.2: Commit**

```bash
git add src/services/batch/batch-export.service.ts
git commit -m "feat(batch): add batch export service with queue"
```

---

## Task 3: Update Barrel Exports

### Step 3.1: Update index files

- [ ] **Step 3.1.1: Update core barrel**

```typescript
// Update src/core/batch/index.ts - add at end:

export type {
  BatchExportJob,
  BatchExportStatus,
  BatchExportProgress,
  BatchExportSettings,
} from './batch-export-model';
export {
  DEFAULT_BATCH_EXPORT_SETTINGS,
  createBatchExportJob,
  getExportPercentage,
  isExportComplete,
} from './batch-export-model';
```

- [ ] **Step 3.1.2: Update service barrel**

```typescript
// Update src/services/batch/index.ts - add at end:

export {
  startBatchExport,
  cancelBatchExport,
  pauseBatchExport,
  resumeBatchExport,
  isBatchExportRunning,
  type ExportProgressCallback,
  type ExportItemCallback,
} from './batch-export.service';
```

- [ ] **Step 3.1.3: Commit**

```bash
git add src/core/batch/index.ts src/services/batch/index.ts
git commit -m "feat(batch): export batch export types and service"
```

---

## Completion Checklist

- [ ] BatchExportJob model with progress tracking
- [ ] Export service with queue processing
- [ ] Pause/resume/cancel controls
- [ ] Save to gallery integration
- [ ] Barrel exports updated

**Next:** Phase 3C - Batch UI
