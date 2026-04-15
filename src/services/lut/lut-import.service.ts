import { parseCube } from '@lut-core/cube';
import { parseHald } from '@lut-core/hald';
import type { LutTable } from '@lut-core/model';
import { readFileAsText } from '@adapters/expo/file-system';
import { LutErrors } from '@core/errors/lut-errors';
import { addImportedLut, type ImportedLutRecord } from '@services/storage/imported-lut-store';

export interface ImportedLut {
  readonly record: ImportedLutRecord;
  readonly table: LutTable;
}

export async function importCubeFile(uri: string, name: string): Promise<ImportedLut> {
  const text = await readFileAsText(uri);
  const result = parseCube(text);

  if (!result.ok) {
    throw LutErrors.PARSE_FAILED(result.error.message);
  }

  const record: ImportedLutRecord = {
    id: `imported-cube-${Date.now()}`,
    name,
    uri,
    format: 'cube',
    importedAt: Date.now(),
  };

  await addImportedLut(record);

  return { record, table: result.value.table };
}

export async function importHaldFile(
  uri: string,
  name: string,
  pixelData: Uint8Array,
  width: number,
  height: number,
): Promise<ImportedLut> {
  const result = parseHald(pixelData, width, height);

  if (!result.ok) {
    throw LutErrors.INVALID_HALD(result.error.message);
  }

  const record: ImportedLutRecord = {
    id: `imported-hald-${Date.now()}`,
    name,
    uri,
    format: 'hald',
    importedAt: Date.now(),
  };

  await addImportedLut(record);

  return { record, table: result.value };
}
