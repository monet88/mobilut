import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';

import type { DraftRecord } from '@core/draft';
import type { EditAction } from '@core/edit-session/edit-action';
import { createInitialEditState } from '@core/edit-session/edit-state';
import { canRedo, canUndo } from '@core/edit-session/history';
import { loadDraft, saveDraft } from '@services/storage';

import { editorReducer, type EditorState } from './editor-reducer';

function createEditorState(
  assetId: string,
  assetUri: string,
  width: number,
  height: number,
): EditorState {
  return {
    history: {
      past: [],
      present: createInitialEditState(assetId, assetUri, width, height),
      future: [],
    },
    isLoading: true,
    error: null,
  };
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useEditorSession(assetId: string, assetUri: string, width: number, height: number) {
  const [state, dispatch] = useReducer(editorReducer, createEditorState(assetId, assetUri, width, height));
  const assetParamsRef = useRef({ assetUri, width, height });
  assetParamsRef.current = { assetUri, width, height };
  const hasHydrated = useRef(false);
  const createdAtRef = useRef(Date.now());
  const shouldSkipNextAutosave = useRef(false);
  const sessionIdRef = useRef(0);
  const pendingDraftRef = useRef<DraftRecord | null>(null);
  const activeSaveSessionIdRef = useRef<number | null>(null);
  const activeSaveTokenRef = useRef(0);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const flushQueuedDraft = useCallback(function flushQueuedDraft(sessionId: number) {
    if (sessionId !== sessionIdRef.current || activeSaveSessionIdRef.current === sessionId) {
      return;
    }

    const draft = pendingDraftRef.current;
    if (draft === null) {
      setIsSavingDraft(false);
      return;
    }

    pendingDraftRef.current = null;
    activeSaveSessionIdRef.current = sessionId;
    const saveToken = activeSaveTokenRef.current + 1;
    activeSaveTokenRef.current = saveToken;
    setIsSavingDraft(true);

    void saveDraft(draft)
      .catch((error) => {
        if (sessionId !== sessionIdRef.current) {
          return;
        }

        dispatch({ type: 'SET_ERROR', error: toError(error) });
      })
      .finally(() => {
        if (
          activeSaveSessionIdRef.current === sessionId &&
          activeSaveTokenRef.current === saveToken
        ) {
          activeSaveSessionIdRef.current = null;
        }

        if (sessionId !== sessionIdRef.current) {
          return;
        }

        if (pendingDraftRef.current !== null) {
          flushQueuedDraft(sessionId);
          return;
        }

        if (activeSaveSessionIdRef.current !== sessionId) {
          setIsSavingDraft(false);
        }
      });
  }, []);

  useLayoutEffect(() => {
    const sessionId = sessionIdRef.current + 1;
    sessionIdRef.current = sessionId;
    hasHydrated.current = false;
    createdAtRef.current = Date.now();
    shouldSkipNextAutosave.current = false;
    pendingDraftRef.current = null;
    activeSaveSessionIdRef.current = null;
    setIsSavingDraft(false);
    dispatch({
      type: 'RESET',
      assetId,
      assetUri: assetParamsRef.current.assetUri,
      width: assetParamsRef.current.width,
      height: assetParamsRef.current.height,
    });

    let cancelled = false;

    void loadDraft(assetId)
      .then((draft) => {
        if (cancelled || sessionId !== sessionIdRef.current) {
          return;
        }

        hasHydrated.current = true;
        if (draft) {
          createdAtRef.current = draft.summary.createdAt;
          shouldSkipNextAutosave.current = true;
          dispatch({ type: 'HYDRATE', draft });
          return;
        }

        dispatch({ type: 'SET_LOADING', loading: false });
      })
      .catch((error) => {
        if (cancelled || sessionId !== sessionIdRef.current) {
          return;
        }

        hasHydrated.current = true;
        dispatch({ type: 'SET_LOADING', loading: false });
        dispatch({ type: 'SET_ERROR', error: toError(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  useEffect(() => {
    if (!hasHydrated.current) {
      return;
    }

    if (shouldSkipNextAutosave.current) {
      shouldSkipNextAutosave.current = false;
      return;
    }

    pendingDraftRef.current = {
      summary: {
        assetId: state.history.present.assetId,
        assetUri: state.history.present.assetUri,
        previewUri: state.history.present.assetUri,
        createdAt: createdAtRef.current,
        updatedAt: Date.now(),
      },
      history: state.history,
    };
    setIsSavingDraft(true);
    flushQueuedDraft(sessionIdRef.current);
  }, [flushQueuedDraft, state.history]);

  const dispatchEdit = useCallback((action: EditAction) => {
    if (state.isLoading) {
      return;
    }

    dispatch({ type: 'EDIT', action });
  }, [state.isLoading]);
  const undo = useCallback(() => {
    if (state.isLoading) {
      return;
    }

    dispatch({ type: 'UNDO' });
  }, [state.isLoading]);
  const redo = useCallback(() => {
    if (state.isLoading) {
      return;
    }

    dispatch({ type: 'REDO' });
  }, [state.isLoading]);

  return {
    editState: state.history.present,
    history: state.history,
    isLoading: state.isLoading,
    isSavingDraft,
    error: state.error,
    canUndo: canUndo(state.history),
    canRedo: canRedo(state.history),
    dispatch: dispatchEdit,
    undo,
    redo,
  };
}
