import { useCallback, useState } from 'react';

import type { EditState } from '@core/edit-session/edit-state';
import type { ExportRequest, Transform } from '@core/image-pipeline';
import { renderExport } from '@services/image/export-render.service';
import { saveImageToGallery } from '@adapters/expo/media-library';
import { shareFile } from '@adapters/expo/sharing';

export interface UseExportImageResult {
  readonly isExporting: boolean;
  readonly error: Error | null;
  readonly exportToGallery: (
    editState: EditState,
  ) => Promise<Awaited<ReturnType<typeof renderExport>> | null>;
  readonly exportAndShare: (
    editState: EditState,
  ) => Promise<Awaited<ReturnType<typeof renderExport>> | null>;
}

export function useExportImage(): UseExportImageResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportToGallery = useCallback(async (editState: EditState) => {
    setIsExporting(true);
    setError(null);

    try {
      const request = buildExportRequest(editState);
      const result = await renderExport(request);
      await saveImageToGallery(result.uri);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const exportAndShare = useCallback(async (editState: EditState) => {
    setIsExporting(true);
    setError(null);

    try {
      const request = buildExportRequest(editState);
      const result = await renderExport(request);
      await shareFile(result.uri, 'image/jpeg');
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { isExporting, error, exportToGallery, exportAndShare };
}

function buildExportRequest(state: EditState): ExportRequest & {
  readonly rotation: 0 | 90 | 180 | 270;
  readonly crop: EditState['crop'];
  readonly outputFormat: 'jpeg';
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
    format: 'jpeg',
    quality: 0.95,
    targetWidth: state.crop
      ? Math.max(1, Math.round(state.assetWidth * state.crop.width))
      : state.assetWidth,
    targetHeight: state.crop
      ? Math.max(1, Math.round(state.assetHeight * state.crop.height))
      : state.assetHeight,
    includeMetadata: true,
    rotation: state.rotation,
    crop: state.crop,
    outputFormat: 'jpeg',
  };
}
