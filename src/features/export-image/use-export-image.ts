import { useCallback, useState } from 'react';

import type { EditState } from '@core/edit-session/edit-state';
import type { ExportFormat, ExportRequest, Transform } from '@core/image-pipeline';
import { renderExport } from '@services/image/export-render.service';
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

function buildExportRequest(
  state: EditState,
  format: Extract<ExportFormat, 'jpeg' | 'png'>,
): ExportRequest & {
  readonly rotation: 0 | 90 | 180 | 270;
  readonly crop: EditState['crop'];
  readonly outputFormat: Extract<ExportFormat, 'jpeg' | 'png'>;
} {
  const transforms: Transform[] = [];

  if (state.rotation !== 0) {
    transforms.push({ type: 'rotate', degrees: state.rotation });
  }

  if (state.crop) {
    transforms.push({ type: 'crop', params: state.crop });
  }

  if (state.selectedPresetId) {
    transforms.push({ type: 'lut', presetId: state.selectedPresetId });
  }

  if (state.customLutTable) {
    transforms.push({ type: 'custom-lut', lutId: 'custom-export' });
  }

  transforms.push({ type: 'adjust', params: state.adjustments });

  if (state.regionMask) {
    transforms.push({ type: 'region-mask', mask: state.regionMask });
  }

  if (state.framing) {
    transforms.push({ type: 'framing', params: state.framing });
  }

  if (state.watermark) {
    transforms.push({ type: 'watermark', params: state.watermark });
  }

  const transformedDimensions = getTransformedDimensions(state);

  return {
    asset: {
      id: state.assetId,
      uri: state.assetUri,
      width: state.assetWidth,
      height: state.assetHeight,
      format: 'jpeg',
      fileSize: null,
    },
    transforms,
    format,
    quality: 0.95,
    targetWidth: transformedDimensions.width,
    targetHeight: transformedDimensions.height,
    includeMetadata: true,
    rotation: state.rotation,
    crop: state.crop,
    outputFormat: format,
  };
}

function getTransformedDimensions(state: EditState): {
  readonly width: number;
  readonly height: number;
} {
  let width = state.assetWidth;
  let height = state.assetHeight;

  if (state.rotation === 90 || state.rotation === 270) {
    [width, height] = [height, width];
  }

  if (state.crop) {
    width = Math.max(1, Math.round(width * state.crop.width));
    height = Math.max(1, Math.round(height * state.crop.height));
  }

  return { width, height };
}
