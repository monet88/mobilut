import type { DraftRecord, DraftSummary } from '@core/draft';
import type { EditState } from '@core/edit-session/edit-state';
import type { History } from '@core/edit-session/history';
import {
  deleteFile,
  ensureDirectory,
  getDocumentDirectory,
  readFileAsText,
  writeFile,
} from '@adapters/expo/file-system';

interface SerializedLutTable {
  readonly size: number;
  readonly data: readonly number[];
}

interface SerializedEditState extends Omit<EditState, 'customLutTable'> {
  readonly customLutTable: SerializedLutTable | null;
}

interface SerializedDraftRecord {
  readonly summary: DraftSummary;
  readonly history: History<SerializedEditState>;
}

const DRAFTS_DIR = `${getDocumentDirectory()}drafts/`;
const INDEX_FILE = `${DRAFTS_DIR}index.json`;

function draftFile(assetId: string): string {
  return `${DRAFTS_DIR}${encodeURIComponent(assetId)}.json`;
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('ENOENT');
}

function serializeEditState(state: EditState): SerializedEditState {
  return {
    ...state,
    customLutTable:
      state.customLutTable === null
        ? null
        : {
            size: state.customLutTable.size,
            data: Array.from(state.customLutTable.data),
          },
  };
}

function deserializeEditState(state: SerializedEditState): EditState {
  return {
    ...state,
    customLutTable:
      state.customLutTable === null
        ? null
        : {
            size: state.customLutTable.size,
            data: new Float32Array(state.customLutTable.data),
          },
  };
}

function serializeDraftRecord(record: DraftRecord): SerializedDraftRecord {
  return {
    summary: record.summary,
    history: {
      past: record.history.past.map(serializeEditState),
      present: serializeEditState(record.history.present),
      future: record.history.future.map(serializeEditState),
    },
  };
}

function deserializeDraftRecord(record: SerializedDraftRecord): DraftRecord {
  return {
    summary: record.summary,
    history: {
      past: record.history.past.map(deserializeEditState),
      present: deserializeEditState(record.history.present),
      future: record.history.future.map(deserializeEditState),
    },
  };
}

async function readIndex(): Promise<readonly DraftSummary[]> {
  try {
    const raw = await readFileAsText(INDEX_FILE);
    return JSON.parse(raw) as readonly DraftSummary[];
  } catch (error) {
    if (isMissingFileError(error)) {
      return [];
    }

    throw error;
  }
}

async function writeIndex(index: readonly DraftSummary[]): Promise<void> {
  await ensureDirectory(DRAFTS_DIR);
  await writeFile(INDEX_FILE, JSON.stringify(index));
}

export async function saveDraft(record: DraftRecord): Promise<void> {
  const index = await readIndex();

  await ensureDirectory(DRAFTS_DIR);
  await writeFile(draftFile(record.summary.assetId), JSON.stringify(serializeDraftRecord(record)));

  const nextIndex = [
    record.summary,
    ...index.filter((item) => item.assetId !== record.summary.assetId),
  ].sort((left, right) => right.updatedAt - left.updatedAt);

  await writeIndex(nextIndex);
}

export async function loadDraft(assetId: string): Promise<DraftRecord | null> {
  try {
    const raw = await readFileAsText(draftFile(assetId));
    return deserializeDraftRecord(JSON.parse(raw) as SerializedDraftRecord);
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
}

export async function listDrafts(): Promise<readonly DraftSummary[]> {
  return readIndex();
}

export async function deleteDraft(assetId: string): Promise<void> {
  const index = await readIndex();

  await deleteFile(draftFile(assetId));
  await writeIndex(index.filter((item) => item.assetId !== assetId));
}
