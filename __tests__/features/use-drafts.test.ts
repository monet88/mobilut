import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockDeleteDraft = jest.fn(async () => undefined);
const mockListDrafts = jest.fn();

jest.mock('@services/storage', () => ({
  deleteDraft: (...args: unknown[]) => mockDeleteDraft(...args),
  listDrafts: (...args: unknown[]) => mockListDrafts(...args),
}));

const { useDrafts } = require('@features/home/use-drafts');

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
}

describe('useDrafts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the latest refresh results when an older refresh resolves later', async () => {
    const initialRefresh = createDeferred<
      readonly [{ readonly assetId: 'asset-1'; readonly assetUri: 'file:///older.jpg'; readonly previewUri: 'file:///older.jpg'; readonly createdAt: 1; readonly updatedAt: 1 }]
    >();
    const nextRefresh = createDeferred<
      readonly [{ readonly assetId: 'asset-2'; readonly assetUri: 'file:///newer.jpg'; readonly previewUri: 'file:///newer.jpg'; readonly createdAt: 2; readonly updatedAt: 2 }]
    >();

    const olderDrafts = [
      {
        assetId: 'asset-1',
        assetUri: 'file:///older.jpg',
        previewUri: 'file:///older.jpg',
        createdAt: 1,
        updatedAt: 1,
      },
    ] as const;
    const newerDrafts = [
      {
        assetId: 'asset-2',
        assetUri: 'file:///newer.jpg',
        previewUri: 'file:///newer.jpg',
        createdAt: 2,
        updatedAt: 2,
      },
    ] as const;

    mockListDrafts
      .mockReturnValueOnce(initialRefresh.promise)
      .mockReturnValueOnce(nextRefresh.promise);

    const { result } = renderHook(() => useDrafts());

    await waitFor(() => {
      expect(mockListDrafts).toHaveBeenCalledTimes(1);
    });

    act(() => {
      void result.current.refresh();
    });

    await waitFor(() => {
      expect(mockListDrafts).toHaveBeenCalledTimes(2);
    });

    act(() => {
      nextRefresh.resolve(newerDrafts);
    });

    await waitFor(() => {
      expect(result.current.drafts).toEqual(newerDrafts);
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      initialRefresh.resolve(olderDrafts);
    });

    await waitFor(() => {
      expect(result.current.drafts).toEqual(newerDrafts);
    });
  });
});
