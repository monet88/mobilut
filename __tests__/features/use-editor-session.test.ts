import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockLoadDraft = jest.fn();
const mockSaveDraft = jest.fn(async () => undefined);

jest.mock('@services/storage', () => ({
  loadDraft: mockLoadDraft,
  saveDraft: mockSaveDraft,
}));

const { useEditorSession } = require('@features/editor/use-editor-session');

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

function createDraftRecord(selectedPresetId: string | null) {
  return {
    summary: {
      assetId: 'asset-1',
      assetUri: 'file:///draft.jpg',
      previewUri: 'file:///draft.jpg',
      createdAt: 1,
      updatedAt: 2,
    },
    history: {
      past: [],
      present: {
        assetId: 'asset-1',
        assetUri: 'file:///draft.jpg',
        assetWidth: 1200,
        assetHeight: 900,
        selectedPresetId,
        customLutTable: null,
        adjustments: {
          intensity: 1,
          temperature: 0,
          brightness: 0,
          contrast: 0,
          saturation: 0,
          sharpen: 0,
        },
        rotation: 0,
        crop: null,
        regionMask: null,
        framing: null,
        watermark: null,
      },
      future: [],
    },
  };
}

describe('useEditorSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hydrates from a saved draft and autosaves future edits', async () => {
    mockLoadDraft.mockResolvedValue(createDraftRecord('preset-1'));

    const { result } = renderHook(() =>
      useEditorSession('asset-1', 'file:///fallback.jpg', 1200, 900),
    );

    await waitFor(() => {
      expect(result.current.editState.selectedPresetId).toBe('preset-1');
    });

    act(() => {
      result.current.dispatch({ type: 'CLEAR_PRESET' });
    });

    await waitFor(() => {
      expect(mockSaveDraft).toHaveBeenCalledTimes(1);
    });
  });

  it('resets immediately when the asset id changes and keeps the new asset state when no draft exists', async () => {
    const nextLoadDraft = createDeferred<null>();
    mockLoadDraft
      .mockResolvedValueOnce(createDraftRecord('preset-1'))
      .mockReturnValueOnce(nextLoadDraft.promise);

    const { result, rerender } = renderHook(
      ({ currentAssetId, currentAssetUri }) =>
        useEditorSession(currentAssetId, currentAssetUri, 1200, 900),
      {
        initialProps: {
          currentAssetId: 'asset-1',
          currentAssetUri: 'file:///fallback.jpg',
        },
      },
    );

    await waitFor(() => {
      expect(result.current.editState.selectedPresetId).toBe('preset-1');
    });

    rerender({ currentAssetId: 'asset-2', currentAssetUri: 'file:///second.jpg' });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.history.past).toEqual([]);
    expect(result.current.history.future).toEqual([]);
    expect(result.current.editState.assetId).toBe('asset-2');
    expect(result.current.editState.assetUri).toBe('file:///second.jpg');
    expect(result.current.editState.selectedPresetId).toBeNull();

    act(() => {
      nextLoadDraft.resolve(null);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.editState.assetId).toBe('asset-2');
    expect(result.current.editState.selectedPresetId).toBeNull();
  });


  it('ignores edits until hydration completes', async () => {
    const pendingLoad = createDeferred<null>();
    mockLoadDraft.mockReturnValueOnce(pendingLoad.promise);

    const { result } = renderHook(() =>
      useEditorSession('asset-1', 'file:///fallback.jpg', 1200, 900),
    );

    act(() => {
      result.current.dispatch({ type: 'SELECT_PRESET', presetId: 'preset-1' });
      result.current.undo();
      result.current.redo();
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.editState.selectedPresetId).toBeNull();
    expect(result.current.history.past).toEqual([]);
    expect(mockSaveDraft).not.toHaveBeenCalled();

    act(() => {
      pendingLoad.resolve(null);
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.editState.selectedPresetId).toBeNull();
    expect(result.current.history.past).toEqual([]);
    expect(mockSaveDraft).not.toHaveBeenCalled();
  });

  it('keeps isSavingDraft true until the queued latest save finishes', async () => {
    const firstSave = createDeferred<void>();
    const secondSave = createDeferred<void>();

    mockLoadDraft.mockResolvedValue(null);
    mockSaveDraft
      .mockReturnValueOnce(firstSave.promise)
      .mockReturnValueOnce(secondSave.promise);

    const { result } = renderHook(() =>
      useEditorSession('asset-1', 'file:///fallback.jpg', 1200, 900),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.dispatch({ type: 'SELECT_PRESET', presetId: 'preset-1' });
    });

    await waitFor(() => {
      expect(mockSaveDraft).toHaveBeenCalledTimes(1);
      expect(result.current.isSavingDraft).toBe(true);
    });

    act(() => {
      result.current.dispatch({ type: 'CLEAR_PRESET' });
    });

    expect(mockSaveDraft).toHaveBeenCalledTimes(1);
    expect(result.current.isSavingDraft).toBe(true);

    act(() => {
      firstSave.resolve();
    });

    await waitFor(() => {
      expect(mockSaveDraft).toHaveBeenCalledTimes(2);
    });
    expect(mockSaveDraft.mock.calls[1]?.[0].history.present.selectedPresetId).toBeNull();
    expect(result.current.isSavingDraft).toBe(true);

    act(() => {
      secondSave.resolve();
    });

    await waitFor(() => {
      expect(result.current.isSavingDraft).toBe(false);
    });
  });
});
