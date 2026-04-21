import { waitFor } from '@testing-library/react-native';

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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
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

  it('shares cache directory creation work across concurrent thumbnail requests', async () => {
    mockGetCacheDirectory.mockReturnValue('file:///cache/');
    const ensureDirectoryTask = deferred<void>();

    mockGetFileInfo.mockImplementation(async (uri: string) => {
      if (uri === 'file:///cache/batch-thumbnails/') {
        return { exists: false };
      }

      return { exists: false };
    });
    mockEnsureDirectory.mockImplementation(() => ensureDirectoryTask.promise);
    mockResizeImage.mockResolvedValue('file:///tmp/thumb.jpg');
    mockCopyFile.mockResolvedValue(undefined);

    const { generateThumbnail } = loadModule();

    const first = generateThumbnail('photo-1', 'file:///source-1.jpg');
    const second = generateThumbnail('photo-2', 'file:///source-2.jpg');

    await waitFor(() => {
      expect(mockEnsureDirectory).toHaveBeenCalledTimes(1);
    });

    ensureDirectoryTask.resolve();

    await expect(Promise.all([first, second])).resolves.toEqual([
      'file:///cache/batch-thumbnails/photo-1.jpg',
      'file:///cache/batch-thumbnails/photo-2.jpg',
    ]);
  });

  it('rechecks and recreates the cache directory after it is later removed', async () => {
    mockGetCacheDirectory.mockReturnValue('file:///cache/');
    const cacheDirectoryChecks = [
      { exists: false },
      { exists: false },
    ];

    mockGetFileInfo.mockImplementation(async (uri: string) => {
      if (uri === 'file:///cache/batch-thumbnails/') {
        return cacheDirectoryChecks.shift() ?? { exists: true };
      }

      return { exists: false };
    });
    mockEnsureDirectory.mockResolvedValue(undefined);
    mockResizeImage.mockResolvedValue('file:///tmp/thumb.jpg');
    mockCopyFile.mockResolvedValue(undefined);

    const { generateThumbnail } = loadModule();

    await generateThumbnail('photo-1', 'file:///source-1.jpg');
    await generateThumbnail('photo-2', 'file:///source-2.jpg');

    expect(mockEnsureDirectory).toHaveBeenCalledTimes(2);
    expect(mockGetFileInfo.mock.calls.filter(([uri]) => uri === 'file:///cache/batch-thumbnails/')).toHaveLength(2);
  });
});
