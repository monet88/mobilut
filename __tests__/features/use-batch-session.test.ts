import { act, renderHook } from '@testing-library/react-native';

const mockCreateWorkspaceWithPhotos = jest.fn();
const mockAddPhotosToWorkspace = jest.fn();
const mockRemovePhotoFromWorkspace = jest.fn();
const mockSelectPhoto = jest.fn();
const mockApplyPreset = jest.fn();
const mockExportBatch = jest.fn();

jest.mock('@services/batch', () => ({
  createWorkspaceWithPhotos: (...args: unknown[]) => mockCreateWorkspaceWithPhotos(...args),
  addPhotosToWorkspace: (...args: unknown[]) => mockAddPhotosToWorkspace(...args),
  removePhotoFromWorkspace: (...args: unknown[]) => mockRemovePhotoFromWorkspace(...args),
  selectPhoto: (...args: unknown[]) => mockSelectPhoto(...args),
  applyPreset: (...args: unknown[]) => mockApplyPreset(...args),
  exportBatch: (...args: unknown[]) => mockExportBatch(...args),
}));

const { useBatchSession } = require('@features/batch/use-batch-session');

function workspace(overrides: Partial<{ photos: { id: string }[]; selectedPhotoId: string | null; appliedPresetId: string | null; appliedIntensity: number }> = {}) {
  return {
    id: 'ws-1',
    photos:
      overrides.photos ?? [
        { id: 'photo-1', uri: 'file:///1.jpg', width: 100, height: 100, thumbnailUri: null, status: 'pending', error: null },
        { id: 'photo-2', uri: 'file:///2.jpg', width: 100, height: 100, thumbnailUri: null, status: 'pending', error: null },
      ],
    selectedPhotoId: overrides.selectedPhotoId ?? 'photo-1',
    appliedPresetId: overrides.appliedPresetId ?? null,
    appliedIntensity: overrides.appliedIntensity ?? 1,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('useBatchSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateWorkspaceWithPhotos.mockResolvedValue(workspace());
    mockAddPhotosToWorkspace.mockResolvedValue(workspace());
    mockRemovePhotoFromWorkspace.mockResolvedValue(workspace({ photos: [{ id: 'photo-2', uri: 'file:///2.jpg', width: 100, height: 100, thumbnailUri: null, status: 'pending', error: null }], selectedPhotoId: 'photo-2' }));
    mockSelectPhoto.mockImplementation((current, photoId) => ({ ...current, selectedPhotoId: photoId }));
    mockApplyPreset.mockImplementation((current, presetId, intensity) => ({ ...current, appliedPresetId: presetId, appliedIntensity: intensity }));
    mockExportBatch.mockImplementation(async (_workspace, _options, onProgress) => {
      onProgress({ total: 2, completed: 1, failed: 0, currentPhotoId: 'photo-2' });
      return { successful: ['photo-1', 'photo-2'], failed: [] };
    });
  });

  it('adds photos and transitions into previewing with a selected photo', async () => {
    const { result } = renderHook(() => useBatchSession());

    await act(async () => {
      await result.current.addPhotos([{ id: 'photo-1', uri: 'file:///1.jpg', width: 100, height: 100 }]);
    });

    expect(result.current.session.state).toBe('previewing');
    expect(result.current.selectedPhoto?.id).toBe('photo-1');
    expect(mockCreateWorkspaceWithPhotos).toHaveBeenCalledTimes(1);
  });

  it('removes the current photo and falls back to the first remaining selection', async () => {
    const { result } = renderHook(() => useBatchSession());

    await act(async () => {
      await result.current.removePhoto('photo-1');
    });

    expect(result.current.session.workspace.selectedPhotoId).toBe('photo-2');
    expect(result.current.selectedPhoto?.id).toBe('photo-2');
  });

  it('tracks export progress and completes successfully', async () => {
    const { result } = renderHook(() => useBatchSession());

    await act(async () => {
      await result.current.startExport('jpeg');
    });

    expect(result.current.session.state).toBe('completed');
    expect(result.current.session.exportProgress).toEqual(
      expect.objectContaining({
        total: 2,
        completed: 1,
        currentPhotoId: 'photo-2',
      }),
    );
  });

  it('guards navigation at the bounds of the thumbnail strip', async () => {
    const { result } = renderHook(() => useBatchSession());

    await act(async () => {
      await result.current.addPhotos([{ id: 'photo-1', uri: 'file:///1.jpg', width: 100, height: 100 }]);
    });

    act(() => {
      result.current.navigatePrev();
    });
    expect(mockSelectPhoto).not.toHaveBeenCalled();

    act(() => {
      result.current.navigateNext();
    });

    expect(mockSelectPhoto).toHaveBeenCalledWith(expect.anything(), 'photo-2');
  });
});
