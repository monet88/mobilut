import { useCallback, useState } from 'react';

import { pickCubeFile } from '@adapters/expo/document-picker';
import { importCubeFile, type ImportedLut } from '@services/lut/lut-import.service';

export interface UseImportLutResult {
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly importLut: () => Promise<ImportedLut | null>;
}

export function useImportLut(): UseImportLutResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const importLut = useCallback(async (): Promise<ImportedLut | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const document = await pickCubeFile();

      if (!document) {
        return null;
      }

      return await importCubeFile(document.uri, document.name);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, importLut };
}
