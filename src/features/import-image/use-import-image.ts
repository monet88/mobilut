import { useCallback, useState } from 'react';

import { pickImageFromLibrary } from '@adapters/expo/image-picker';
import type { ImageAsset } from '@core/image-pipeline/image-asset';

export interface UseImportImageResult {
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly pickImage: () => Promise<ImageAsset | null>;
}

export function useImportImage(): UseImportImageResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pickImage = useCallback(async (): Promise<ImageAsset | null> => {
    setIsLoading(true);
    setError(null);

    try {
      return await pickImageFromLibrary();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, pickImage };
}
