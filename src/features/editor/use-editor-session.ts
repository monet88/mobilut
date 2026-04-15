import { useCallback, useReducer } from 'react';

import type { EditAction } from '@core/edit-session/edit-action';
import { createInitialEditState } from '@core/edit-session/edit-state';
import { canRedo, canUndo } from '@core/edit-session/history';

import { editorReducer, type EditorState } from './editor-reducer';

export function useEditorSession(assetId: string, assetUri: string, width: number, height: number) {
  const initialState: EditorState = {
    history: {
      past: [],
      present: createInitialEditState(assetId, assetUri, width, height),
      future: [],
    },
    isLoading: false,
    error: null,
  };

  const [state, dispatch] = useReducer(editorReducer, initialState);

  const dispatchEdit = useCallback((action: EditAction) => {
    dispatch({ type: 'EDIT', action });
  }, []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  return {
    editState: state.history.present,
    isLoading: state.isLoading,
    error: state.error,
    canUndo: canUndo(state.history),
    canRedo: canRedo(state.history),
    dispatch: dispatchEdit,
    undo,
    redo,
  };
}
