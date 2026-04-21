import type { BatchWorkspace } from './batch-workspace-model';

export type BatchSessionState = 
  | 'idle'
  | 'selecting'
  | 'previewing'
  | 'applying'
  | 'exporting'
  | 'completed'
  | 'error';

export interface BatchSession {
  readonly workspace: BatchWorkspace;
  readonly state: BatchSessionState;
  readonly exportProgress: BatchExportProgress | null;
  readonly error: BatchError | null;
}

export interface BatchExportProgress {
  readonly total: number;
  readonly completed: number;
  readonly failed: number;
  readonly currentPhotoId: string | null;
}

export interface BatchError {
  readonly code: 'SELECTION_LIMIT' | 'EXPORT_PARTIAL' | 'EXPORT_FAILED' | 'PERMISSION_DENIED';
  readonly message: string;
  readonly failedPhotoIds?: readonly string[];
}

export function createBatchSession(workspace: BatchWorkspace): BatchSession {
  return {
    workspace,
    state: 'idle',
    exportProgress: null,
    error: null,
  };
}

export function isExportComplete(progress: BatchExportProgress): boolean {
  return progress.completed + progress.failed >= progress.total;
}

export function hasPartialFailure(progress: BatchExportProgress): boolean {
  return progress.failed > 0 && progress.completed > 0;
}
