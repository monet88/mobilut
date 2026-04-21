const mockGenerateThumbnail = jest.fn();
const mockClearThumbnail = jest.fn();

jest.mock('@services/batch/thumbnail-cache', () => ({
  generateThumbnail: (...args: unknown[]) => mockGenerateThumbnail(...args),
  clearThumbnail: (...args: unknown[]) => mockClearThumbnail(...args),
}));

const {
  createWorkspaceWithPhotos,
  addPhotosToWorkspace,
  removePhotoFromWorkspace,
} = require('@services/batch/batch-workspace');
const { MAX_BATCH_PHOTOS } = require('@core/batch');

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function selection(id: string) {
  return {
    id,
    uri: `file:///${id}.jpg`,
    width: 100,
    height: 100,
  };
}

describe('batch-workspace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts thumbnail generation for all selected photos without serial blocking', async () => {
    const first = deferred<string>();
    const second = deferred<string>();

    mockGenerateThumbnail
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);

    const workspacePromise = createWorkspaceWithPhotos([selection('one'), selection('two')]);

    expect(mockGenerateThumbnail).toHaveBeenCalledTimes(2);

    first.resolve('thumb://one');
    second.resolve('thumb://two');

    await expect(workspacePromise).resolves.toEqual(
      expect.objectContaining({
        selectedPhotoId: 'one',
        photos: expect.arrayContaining([
          expect.objectContaining({ id: 'one', thumbnailUri: 'thumb://one' }),
          expect.objectContaining({ id: 'two', thumbnailUri: 'thumb://two' }),
        ]),
      }),
    );
  });

  it('rejects selections above the batch limit', async () => {
    const selections = Array.from({ length: MAX_BATCH_PHOTOS + 1 }, (_, index) =>
      selection(`photo-${index}`),
    );

    await expect(createWorkspaceWithPhotos(selections)).rejects.toThrow(
      `Cannot add more than ${MAX_BATCH_PHOTOS} photos to batch`,
    );
  });

  it('falls back to the first remaining photo when removing the current selection', async () => {
    mockClearThumbnail.mockResolvedValue(undefined);

    const workspace = {
      id: 'ws-1',
      photos: [
        {
          id: 'photo-1',
          uri: 'file:///photo-1.jpg',
          width: 100,
          height: 100,
          thumbnailUri: 'thumb://1',
          status: 'pending',
          error: null,
        },
        {
          id: 'photo-2',
          uri: 'file:///photo-2.jpg',
          width: 100,
          height: 100,
          thumbnailUri: 'thumb://2',
          status: 'pending',
          error: null,
        },
      ],
      selectedPhotoId: 'photo-1',
      appliedPresetId: null,
      appliedIntensity: 1,
      createdAt: 0,
      updatedAt: 0,
    };

    await expect(removePhotoFromWorkspace(workspace, 'photo-1')).resolves.toEqual(
      expect.objectContaining({
        selectedPhotoId: 'photo-2',
        photos: [expect.objectContaining({ id: 'photo-2' })],
      }),
    );
    expect(mockClearThumbnail).toHaveBeenCalledWith('photo-1');
  });

  it('rejects additions that would exceed the batch limit', async () => {
    const workspace = {
      id: 'ws-1',
      photos: Array.from({ length: MAX_BATCH_PHOTOS }, (_, index) => ({
        id: `photo-${index}`,
        uri: `file:///photo-${index}.jpg`,
        width: 100,
        height: 100,
        thumbnailUri: null,
        status: 'pending',
        error: null,
      })),
      selectedPhotoId: 'photo-0',
      appliedPresetId: null,
      appliedIntensity: 1,
      createdAt: 0,
      updatedAt: 0,
    };

    await expect(addPhotosToWorkspace(workspace, [selection('overflow')])).rejects.toThrow(
      `Cannot add more than ${MAX_BATCH_PHOTOS} photos to batch`,
    );
  });
});
