import type { DraftRecord } from '@core/draft';
import type { EditAction } from '@core/edit-session/edit-action';
import {
  createInitialEditState,
  DEFAULT_ADJUSTMENTS,
  type EditState,
} from '@core/edit-session/edit-state';
import { pushHistory, redoHistory, undoHistory, type History } from '@core/edit-session/history';

export interface EditorState {
  readonly history: History<EditState>;
  readonly isLoading: boolean;
  readonly error: Error | null;
}

export type EditorAction =
  | { readonly type: 'EDIT'; readonly action: EditAction }
  | { readonly type: 'UNDO' }
  | { readonly type: 'REDO' }
  | { readonly type: 'SET_LOADING'; readonly loading: boolean }
  | { readonly type: 'SET_ERROR'; readonly error: Error | null }
  | { readonly type: 'HYDRATE'; readonly draft: DraftRecord }
  | {
      readonly type: 'RESET';
      readonly assetId: string;
      readonly assetUri: string;
      readonly width: number;
      readonly height: number;
    };

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'UNDO':
      return { ...state, history: undoHistory(state.history) };
    case 'REDO':
      return { ...state, history: redoHistory(state.history) };
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'HYDRATE':
      return { history: action.draft.history, isLoading: false, error: null };
    case 'RESET': {
      const initial = createInitialEditState(
        action.assetId,
        action.assetUri,
        action.width,
        action.height,
      );
      return { history: { past: [], present: initial, future: [] }, isLoading: true, error: null };
    }
    case 'EDIT': {
      const next = applyEditAction(state.history.present, action.action);
      return { ...state, history: pushHistory(state.history, next) };
    }
    default:
      return state;
  }
}

function applyEditAction(state: EditState, action: EditAction): EditState {
  switch (action.type) {
    case 'SELECT_PRESET':
      return { ...state, selectedPresetId: action.presetId, customLutTable: null };
    case 'CLEAR_PRESET':
      return { ...state, selectedPresetId: null };
    case 'SET_CUSTOM_LUT':
      return { ...state, customLutTable: action.lut, selectedPresetId: null };
    case 'CLEAR_CUSTOM_LUT':
      return { ...state, customLutTable: null };
    case 'SET_ADJUSTMENTS':
      return { ...state, adjustments: { ...state.adjustments, ...action.adjustments } };
    case 'RESET_ADJUSTMENTS':
      return { ...state, adjustments: DEFAULT_ADJUSTMENTS };
    case 'SET_ROTATION':
      return { ...state, rotation: action.rotation };
    case 'ROTATE_CW': {
      const clockwise: Record<0 | 90 | 180 | 270, 0 | 90 | 180 | 270> = {
        0: 90,
        90: 180,
        180: 270,
        270: 0,
      };
      return { ...state, rotation: clockwise[state.rotation] };
    }
    case 'ROTATE_CCW': {
      const counterClockwise: Record<0 | 90 | 180 | 270, 0 | 90 | 180 | 270> = {
        0: 270,
        90: 0,
        180: 90,
        270: 180,
      };
      return { ...state, rotation: counterClockwise[state.rotation] };
    }
    case 'SET_CROP':
      return { ...state, crop: action.crop };
    case 'CLEAR_CROP':
      return { ...state, crop: null };
    case 'SET_REGION_MASK':
      return { ...state, regionMask: action.mask };
    case 'CLEAR_REGION_MASK':
      return { ...state, regionMask: null };
    case 'SET_FRAMING':
      return { ...state, framing: action.framing };
    case 'CLEAR_FRAMING':
      return { ...state, framing: null };
    case 'SET_WATERMARK':
      return { ...state, watermark: action.watermark };
    case 'CLEAR_WATERMARK':
      return { ...state, watermark: null };
    default:
      return state;
  }
}
