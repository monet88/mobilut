import AsyncStorage from '@react-native-async-storage/async-storage';

const IMPORTED_LUTS_KEY = '@lut-app/importedLuts';

export interface ImportedLutRecord {
  readonly id: string;
  readonly name: string;
  readonly uri: string;
  readonly format: 'cube' | 'hald';
  readonly importedAt: number;
}

export async function getImportedLuts(): Promise<ImportedLutRecord[]> {
  try {
    const json = await AsyncStorage.getItem(IMPORTED_LUTS_KEY);

    if (!json) {
      return [];
    }

    return JSON.parse(json) as ImportedLutRecord[];
  } catch {
    return [];
  }
}

export async function addImportedLut(record: ImportedLutRecord): Promise<void> {
  const luts = await getImportedLuts();
  const filtered = luts.filter((lut) => lut.id !== record.id);
  const updated = [record, ...filtered];

  await AsyncStorage.setItem(IMPORTED_LUTS_KEY, JSON.stringify(updated));
}

export async function removeImportedLut(id: string): Promise<void> {
  const luts = await getImportedLuts();
  const filtered = luts.filter((lut) => lut.id !== id);

  await AsyncStorage.setItem(IMPORTED_LUTS_KEY, JSON.stringify(filtered));
}
