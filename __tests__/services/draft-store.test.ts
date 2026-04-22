import type { DraftRecord } from '@core/draft';
import { createInitialEditState } from '@core/edit-session/edit-state';
import { deleteDraft, listDrafts, loadDraft, saveDraft } from '@services/storage/draft-store';

const mockFileMap = new Map<string, string>();
const DRAFTS_DIR = 'file:///documents/drafts/';
const INDEX_FILE = `${DRAFTS_DIR}index.json`;

function getDraftFile(assetId: string): string {
  return `${DRAFTS_DIR}${encodeURIComponent(assetId)}.json`;
}

function createDraftRecord(
  assetId: string,
  updatedAt: number,
  overrides: Partial<DraftRecord> = {},
): DraftRecord {
  const editState = createInitialEditState(assetId, `file:///${assetId}.jpg`, 1200, 900);

  return {
    summary: {
      assetId,
      assetUri: `file:///${assetId}.jpg`,
      previewUri: `file:///${assetId}.jpg`,
      createdAt: updatedAt,
      updatedAt,
      ...overrides.summary,
    },
    history: {
      past: [],
      present: editState,
      future: [],
      ...overrides.history,
    },
  };
}

jest.mock('@adapters/expo/file-system', () => ({
  ensureDirectory: jest.fn(async () => undefined),
  readFileAsText: jest.fn(async (uri: string) => {
    const value = mockFileMap.get(uri);
    if (typeof value !== 'string') {
      throw new Error(`ENOENT: ${uri}`);
    }
    return value;
  }),
  writeFile: jest.fn(async (uri: string, content: string) => {
    mockFileMap.set(uri, content);
  }),
  deleteFile: jest.fn(async (uri: string) => {
    mockFileMap.delete(uri);
  }),
  getDocumentDirectory: jest.fn(() => 'file:///documents/'),
}));

describe('draft-store', () => {
  beforeEach(() => {
    mockFileMap.clear();
  });

  it('treats non-ENOENT missing-file messages as absent drafts and indexes', async () => {
    const { readFileAsText } = jest.requireMock('@adapters/expo/file-system') as {
      readFileAsText: jest.Mock;
    };

    readFileAsText.mockImplementationOnce(async () => {
      throw new Error("File 'file:///documents/drafts/index.json' does not exist");
    });
    await expect(listDrafts()).resolves.toEqual([]);

    readFileAsText.mockImplementationOnce(async () => {
      throw new Error("File 'file:///documents/drafts/asset-1.json' could not be found");
    });
    await expect(loadDraft('asset-1')).resolves.toBeNull();

    readFileAsText.mockImplementationOnce(async () => {
      throw new Error(
        "File 'file:///documents/drafts/index.json' is not readable"
      );
    });
    await expect(listDrafts()).resolves.toEqual([]);
  });

  it('round-trips custom LUT data and keeps JSON storage serializable', async () => {
    const lutData = [0.1, 0.2, 0.3];
    const expectedLutData = Array.from(new Float32Array(lutData));
    const editState = {
      ...createInitialEditState('asset-1', 'file:///photo.jpg', 1200, 900),
      customLutTable: {
        size: 1,
        data: new Float32Array(lutData),
      },
    };

    await saveDraft({
      summary: {
        assetId: 'asset-1',
        assetUri: 'file:///photo.jpg',
        previewUri: 'file:///photo.jpg',
        createdAt: 1,
        updatedAt: 1,
      },
      history: {
        past: [],
        present: editState,
        future: [],
      },
    });

    const storedDraft = JSON.parse(mockFileMap.get(getDraftFile('asset-1')) ?? 'null') as {
      history: { present: { customLutTable: { data: unknown } | null } };
    } | null;

    expect(storedDraft?.history.present.customLutTable?.data).toEqual(expectedLutData);

    const loadedDraft = await loadDraft('asset-1');
    expect(loadedDraft?.history.present.customLutTable?.data).toBeInstanceOf(Float32Array);
    expect(Array.from(loadedDraft?.history.present.customLutTable?.data ?? [])).toEqual(expectedLutData);
  });

  it('does not silently treat malformed index data as an empty list', async () => {
    mockFileMap.set(INDEX_FILE, '{malformed json');

    await expect(listDrafts()).rejects.toBeInstanceOf(SyntaxError);

    await expect(saveDraft(createDraftRecord('asset-2', 2))).rejects.toBeInstanceOf(SyntaxError);
    expect(mockFileMap.get(INDEX_FILE)).toBe('{malformed json');
    expect(mockFileMap.has(getDraftFile('asset-2'))).toBe(false);
  });

  it('saves, lists, loads, and deletes drafts by asset id in updated order without duplicates', async () => {
    const firstDraft = createDraftRecord('asset-1', 1);
    const secondDraft = createDraftRecord('asset-2', 2);
    const updatedFirstDraft = createDraftRecord('asset-1', 3, {
      summary: {
        assetId: 'asset-1',
        assetUri: 'file:///asset-1.jpg',
        previewUri: 'file:///asset-1-updated.jpg',
        createdAt: 1,
        updatedAt: 3,
      },
    });

    await saveDraft(firstDraft);
    await saveDraft(secondDraft);
    await saveDraft(updatedFirstDraft);

    await expect(listDrafts()).resolves.toEqual([
      expect.objectContaining({
        assetId: 'asset-1',
        previewUri: 'file:///asset-1-updated.jpg',
        updatedAt: 3,
      }),
      expect.objectContaining({ assetId: 'asset-2', updatedAt: 2 }),
    ]);
    await expect(loadDraft('asset-1')).resolves.toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          assetId: 'asset-1',
          previewUri: 'file:///asset-1-updated.jpg',
        }),
      }),
    );

    await deleteDraft('asset-1');

    await expect(listDrafts()).resolves.toEqual([
      expect.objectContaining({ assetId: 'asset-2', updatedAt: 2 }),
    ]);
    await expect(loadDraft('asset-1')).resolves.toBeNull();
  });
});
