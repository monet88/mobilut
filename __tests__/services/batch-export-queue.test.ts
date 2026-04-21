const mockRenderExport = jest.fn();
const mockRenderPresetImage = jest.fn();
const mockSaveImageToGallery = jest.fn();
const mockDeleteFile = jest.fn();
const mockSaveToLibraryAsync = jest.fn();

jest.mock('@services/image/export-render.service', () => ({
  renderExport: (...args: unknown[]) => mockRenderExport(...args),
}));

jest.mock('@services/image/preset-render.service', () => ({
  renderPresetImage: (...args: unknown[]) => mockRenderPresetImage(...args),
}));

jest.mock('@adapters/expo/media-library', () => ({
  saveImageToGallery: (...args: unknown[]) => mockSaveImageToGallery(...args),
}));

jest.mock('@adapters/expo/file-system', () => ({
  deleteFile: (...args: unknown[]) => mockDeleteFile(...args),
}));

jest.mock('expo-media-library', () => ({
  saveToLibraryAsync: (...args: unknown[]) => mockSaveToLibraryAsync(...args),
}));

const { exportBatch } = require('@services/batch/batch-export-queue');

function photo(id: string, uri = `file:///${id}.jpg`) {
  return {
    id,
    uri,
    width: 1200,
    height: 900,
    thumbnailUri: null,
    status: 'pending',
    error: null,
  };
}

function workspace(overrides: Partial<{ appliedPresetId: string | null; appliedIntensity: number; photos: ReturnType<typeof photo>[] }> = {}) {
  return {
    id: 'ws-1',
    photos: overrides.photos ?? [photo('photo-1')],
    selectedPhotoId: 'photo-1',
    appliedPresetId: overrides.appliedPresetId ?? null,
    appliedIntensity: overrides.appliedIntensity ?? 1,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('batch-export-queue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRenderPresetImage.mockResolvedValue({
      uri: 'file:///graded.jpg',
      cleanupUris: ['file:///materialized.jpg', 'file:///graded.jpg'],
    });
    mockRenderExport.mockResolvedValue({
      uri: 'file:///rendered.jpg',
      width: 1200,
      height: 900,
      format: 'jpeg',
    });
    mockSaveImageToGallery.mockResolvedValue('file:///saved.jpg');
    mockDeleteFile.mockResolvedValue(undefined);
    mockSaveToLibraryAsync.mockResolvedValue(undefined);
  });

  it('renders batch exports through the image export pipeline when a preset is applied', async () => {
    const progress = jest.fn();

    const result = await exportBatch(
      workspace({ appliedPresetId: 'preset-1', appliedIntensity: 0.35 }),
      { format: 'jpeg', quality: 0.9, preserveOriginalSize: true },
      progress,
    );

    expect(mockRenderPresetImage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'photo-1' }),
      expect.objectContaining({ appliedPresetId: 'preset-1', appliedIntensity: 0.35 }),
      expect.objectContaining({ format: 'jpeg', quality: 0.9 }),
    );
    expect(mockRenderExport).toHaveBeenCalledWith(
      expect.objectContaining({
        asset: expect.objectContaining({ uri: 'file:///graded.jpg' }),
        format: 'jpeg',
        outputFormat: 'jpeg',
      }),
    );
    expect(mockSaveImageToGallery).toHaveBeenCalledWith('file:///rendered.jpg');
    expect(mockDeleteFile).toHaveBeenCalledWith('file:///materialized.jpg');
    expect(mockDeleteFile).toHaveBeenCalledWith('file:///graded.jpg');
    expect(mockDeleteFile).toHaveBeenCalledWith('file:///rendered.jpg');
    expect(result).toEqual({ successful: ['photo-1'], failed: [] });
    expect(progress).toHaveBeenCalled();
  });

  it('rejects unsafe source URIs instead of exporting them', async () => {
    const result = await exportBatch(
      workspace({ photos: [photo('photo-1', 'javascript:alert(1)')] }),
      { format: 'jpeg', quality: 0.9, preserveOriginalSize: true },
      jest.fn(),
    );

    expect(mockRenderExport).not.toHaveBeenCalled();
    expect(result.successful).toEqual([]);
    expect(result.failed).toEqual([
      expect.objectContaining({
        photoId: 'photo-1',
      }),
    ]);
  });

  it('rejects unsafe source URIs before preset rendering starts', async () => {
    const result = await exportBatch(
      workspace({
        appliedPresetId: 'preset-1',
        photos: [photo('photo-unsafe', 'javascript:alert(1)')],
      }),
      { format: 'jpeg', quality: 0.9, preserveOriginalSize: true },
      jest.fn(),
    );

    expect(mockRenderPresetImage).not.toHaveBeenCalled();
    expect(mockRenderExport).not.toHaveBeenCalled();
    expect(result.successful).toEqual([]);
    expect(result.failed).toEqual([
      expect.objectContaining({ photoId: 'photo-unsafe' }),
    ]);
  });

  it('reports partial failures when one photo export fails', async () => {
    mockRenderPresetImage
      .mockResolvedValueOnce({
        uri: 'file:///graded-1.jpg',
        cleanupUris: ['file:///materialized-1.jpg', 'file:///graded-1.jpg'],
      })
      .mockRejectedValueOnce(new Error('preset render failed'));
    mockRenderExport.mockResolvedValue({ uri: 'file:///ok.jpg', width: 1200, height: 900, format: 'jpeg' });

    const result = await exportBatch(
      workspace({ appliedPresetId: 'preset-1', photos: [photo('photo-1'), photo('photo-2')] }),
      { format: 'jpeg', quality: 0.9, preserveOriginalSize: true },
      jest.fn(),
    );

    expect(result.successful).toEqual(['photo-1']);
    expect(result.failed).toEqual([
      { photoId: 'photo-2', error: 'preset render failed' },
    ]);
  });
});
