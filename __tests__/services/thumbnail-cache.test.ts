const mockGetFileInfo = jest.fn();
const mockEnsureDirectory = jest.fn();
const mockCopyFile = jest.fn();
const mockDeleteFile = jest.fn();
const mockGetCacheDirectory = jest.fn();
const mockResizeImage = jest.fn();

jest.mock('@adapters/expo/file-system', () => ({
  getFileInfo: (...args: unknown[]) => mockGetFileInfo(...args),
  ensureDirectory: (...args: unknown[]) => mockEnsureDirectory(...args),
  copyFile: (...args: unknown[]) => mockCopyFile(...args),
  deleteFile: (...args: unknown[]) => mockDeleteFile(...args),
  getCacheDirectory: (...args: unknown[]) => mockGetCacheDirectory(...args),
}));

jest.mock('@adapters/expo/image-manipulator', () => ({
  resizeImage: (...args: unknown[]) => mockResizeImage(...args),
}));

function loadModule() {
  return require('@services/batch/thumbnail-cache');
}

describe('thumbnail-cache', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('sanitizes photo ids before creating cache file paths', async () => {
    mockGetCacheDirectory.mockReturnValue('file:///cache/');
    mockGetFileInfo.mockImplementation(async (uri: string) => {
      if (uri === 'file:///cache/batch-thumbnails/') {
        return { exists: true };
      }

      return { exists: false };
    });
    mockResizeImage.mockResolvedValue('file:///tmp/thumb.jpg');
    mockCopyFile.mockResolvedValue(undefined);

    const { generateThumbnail } = loadModule();
    const result = await generateThumbnail('photo:1/2', 'file:///source.jpg');

    expect(result).toBe('file:///cache/batch-thumbnails/photo_1_2.jpg');
    expect(mockCopyFile).toHaveBeenCalledWith(
      'file:///tmp/thumb.jpg',
      'file:///cache/batch-thumbnails/photo_1_2.jpg',
    );
  });

  it('resizes thumbnails by width only to preserve aspect ratio', async () => {
    mockGetCacheDirectory.mockReturnValue('file:///cache/');
    mockGetFileInfo.mockImplementation(async (uri: string) => {
      if (uri === 'file:///cache/batch-thumbnails/') {
        return { exists: true };
      }

      return { exists: false };
    });
    mockResizeImage.mockResolvedValue('file:///tmp/thumb.jpg');
    mockCopyFile.mockResolvedValue(undefined);

    const { generateThumbnail } = loadModule();
    await generateThumbnail('photo-1', 'file:///source.jpg');

    expect(mockResizeImage).toHaveBeenCalledWith('file:///source.jpg', {
      maxWidth: 200,
      quality: 0.7,
      format: 'jpeg',
    });
  });

  it('creates the cache directory once across repeated thumbnail generation calls', async () => {
    mockGetCacheDirectory.mockReturnValue('file:///cache/');
    mockGetFileInfo.mockImplementation(async () => ({ exists: false }));
    mockResizeImage.mockResolvedValue('file:///tmp/thumb.jpg');
    mockCopyFile.mockResolvedValue(undefined);
    mockEnsureDirectory.mockResolvedValue(undefined);

    const { generateThumbnail } = loadModule();

    await generateThumbnail('photo-1', 'file:///source-1.jpg');
    await generateThumbnail('photo-2', 'file:///source-2.jpg');

    expect(mockGetFileInfo.mock.calls.filter(([uri]) => uri === 'file:///cache/batch-thumbnails/')).toHaveLength(1);
    expect(mockEnsureDirectory).toHaveBeenCalledTimes(1);
  });
});
