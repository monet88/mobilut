import { useCallback, useState } from 'react';

import type { LutTable } from '@lut-core/model/lut-table';
import {
  exportLutAsCube,
  shareLutAsCube,
  type ExportedCube,
} from '@services/lut/lut-export.service';

export interface UseExportLutResult {
  readonly isExporting: boolean;
  readonly error: Error | null;
  readonly exportCube: (table: LutTable, name: string) => Promise<ExportedCube | null>;
  readonly shareCube: (table: LutTable, name: string) => Promise<void>;
}

export function useExportLut(): UseExportLutResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportCube = useCallback(async (table: LutTable, name: string) => {
    setIsExporting(true);
    setError(null);

    try {
      return await exportLutAsCube(table, name);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const shareCube = useCallback(async (table: LutTable, name: string) => {
    setIsExporting(true);
    setError(null);

    try {
      await shareLutAsCube(table, name);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, error, exportCube, shareCube };
}
