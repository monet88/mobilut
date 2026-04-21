import { useCallback, useState } from 'react';

import type { EditState } from '@core/edit-session/edit-state';
import type { ExportFormat } from '@core/image-pipeline';
import { renderExport } from '@services/image/export-render.service';
import { buildExportRequest } from '@services/image/export-request-builder';
import { saveImageToGallery } from '@adapters/expo/media-library';
import { shareFile } from '@adapters/expo/sharing';

export interface UseExportImageResult {
  readonly isExporting: boolean;
  readonly error: Error | null;
  readonly exportToGallery: (
    editState: EditState,
    format: Extract<ExportFormat, 'jpeg' | 'png'>,
  ) => Promise<Awaited<ReturnType<typeof renderExport>> | null>;
  readonly exportAndShare: (
    editState: EditState,
    format: Extract<ExportFormat, 'jpeg' | 'png'>,
  ) => Promise<Awaited<ReturnType<typeof renderExport>> | null>;
}

export function useExportImage(): UseExportImageResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportToGallery = useCallback(
    async (editState: EditState, format: Extract<ExportFormat, 'jpeg' | 'png'>) => {
      setIsExporting(true);
      setError(null);

      try {
        const request = buildExportRequest(editState, format);
        const result = await renderExport(request);
        await saveImageToGallery(result.uri);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  const exportAndShare = useCallback(
    async (editState: EditState, format: Extract<ExportFormat, 'jpeg' | 'png'>) => {
      setIsExporting(true);
      setError(null);

      try {
        const request = buildExportRequest(editState, format);
        const result = await renderExport(request);
        await shareFile(result.uri, result.format === 'png' ? 'image/png' : 'image/jpeg');
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { isExporting, error, exportToGallery, exportAndShare };
}
