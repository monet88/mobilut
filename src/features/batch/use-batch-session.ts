import { useCallback, useMemo, useReducer } from 'react';
import type { BatchSession, BatchWorkspace, BatchExportProgress } from '@core/batch';
import { createBatchWorkspace, createBatchSession } from '@core/batch';
import {
  createWorkspaceWithPhotos,
  addPhotosToWorkspace,
  removePhotoFromWorkspace,
  selectPhoto,
  applyPreset,
  exportBatch,
  type PhotoSelection,
  type BatchExportResult,
} from '@services/batch';

type BatchAction =
  | { type: 'SET_WORKSPACE'; workspace: BatchWorkspace }
  | { type: 'SET_STATE'; state: BatchSession['state'] }
  | { type: 'SET_PROGRESS'; progress: BatchExportProgress | null }
  | { type: 'SET_ERROR'; error: BatchSession['error'] }
  | { type: 'RESET' };

function batchReducer(state: BatchSession, action: BatchAction): BatchSession {
  switch (action.type) {
    case 'SET_WORKSPACE':
      return { ...state, workspace: action.workspace };
    case 'SET_STATE':
      return { ...state, state: action.state };
    case 'SET_PROGRESS':
      return { ...state, exportProgress: action.progress };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'RESET':
      return createBatchSession(createBatchWorkspace());
    default:
      return state;
  }
}

export function useBatchSession() {
  const [session, dispatch] = useReducer(
    batchReducer,
    undefined,
    () => createBatchSession(createBatchWorkspace()),
  );

  const addPhotos = useCallback(
    async (selections: PhotoSelection[]) => {
      dispatch({ type: 'SET_STATE', state: 'selecting' });
      try {
        const workspace =
          session.workspace.photos.length === 0
            ? await createWorkspaceWithPhotos(selections)
            : await addPhotosToWorkspace(session.workspace, selections);
        dispatch({ type: 'SET_WORKSPACE', workspace });
        dispatch({ type: 'SET_STATE', state: 'previewing' });
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          error: {
            code: 'SELECTION_LIMIT',
            message: error instanceof Error ? error.message : 'Failed to add photos',
          },
        });
      }
    },
    [session.workspace],
  );

  const removePhoto = useCallback(
    async (photoId: string) => {
      const workspace = await removePhotoFromWorkspace(session.workspace, photoId);
      dispatch({ type: 'SET_WORKSPACE', workspace });
    },
    [session.workspace],
  );

  const selectPhotoById = useCallback(
    (photoId: string) => {
      const workspace = selectPhoto(session.workspace, photoId);
      dispatch({ type: 'SET_WORKSPACE', workspace });
    },
    [session.workspace],
  );

  const applyLut = useCallback(
    (presetId: string | null, intensity: number) => {
      const workspace = applyPreset(session.workspace, presetId, intensity);
      dispatch({ type: 'SET_WORKSPACE', workspace });
    },
    [session.workspace],
  );

  const startExport = useCallback(
    async (format: 'jpeg' | 'png') => {
      dispatch({ type: 'SET_STATE', state: 'exporting' });
      dispatch({
        type: 'SET_PROGRESS',
        progress: {
          total: session.workspace.photos.length,
          completed: 0,
          failed: 0,
          currentPhotoId: null,
        },
      });

      const result: BatchExportResult = await exportBatch(
        session.workspace,
        { format, quality: 0.9, preserveOriginalSize: true },
        (progress) => dispatch({ type: 'SET_PROGRESS', progress }),
      );

      if (result.failed.length > 0 && result.successful.length > 0) {
        dispatch({
          type: 'SET_ERROR',
          error: {
            code: 'EXPORT_PARTIAL',
            message: `${result.failed.length} photos failed to export`,
            failedPhotoIds: result.failed.map((f) => f.photoId),
          },
        });
      } else if (result.failed.length > 0 && result.successful.length === 0) {
        dispatch({
          type: 'SET_ERROR',
          error: { code: 'EXPORT_FAILED', message: 'All photos failed to export' },
        });
      }

      dispatch({
        type: 'SET_STATE',
        state: result.failed.length > 0 && result.successful.length === 0 ? 'error' : 'completed',
      });
    },
    [session.workspace],
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const selectedPhoto = useMemo(
    () =>
      session.workspace.photos.find((p) => p.id === session.workspace.selectedPhotoId) ?? null,
    [session.workspace],
  );

  const selectedIndex = useMemo(
    () =>
      session.workspace.photos.findIndex((p) => p.id === session.workspace.selectedPhotoId),
    [session.workspace],
  );

  const navigatePrev = useCallback(() => {
    if (selectedIndex > 0) {
      selectPhotoById(session.workspace.photos[selectedIndex - 1].id);
    }
  }, [selectedIndex, session.workspace.photos, selectPhotoById]);

  const navigateNext = useCallback(() => {
    if (selectedIndex < session.workspace.photos.length - 1) {
      selectPhotoById(session.workspace.photos[selectedIndex + 1].id);
    }
  }, [selectedIndex, session.workspace.photos, selectPhotoById]);

  return {
    session,
    selectedPhoto,
    selectedIndex,
    addPhotos,
    removePhoto,
    selectPhotoById,
    applyLut,
    startExport,
    reset,
    navigatePrev,
    navigateNext,
    hasPrev: selectedIndex > 0,
    hasNext: selectedIndex < session.workspace.photos.length - 1,
  };
}
