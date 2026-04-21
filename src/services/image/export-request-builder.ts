import type { EditState } from '@core/edit-session/edit-state';
import type { ExportFormat, ExportRequest, ImageAsset, Transform } from '@core/image-pipeline';
import { ExportErrors } from '@core/errors';
import { isArtisticLookActive } from '@core/render/artistic-look-transform';
import { isProClarityActive } from '@core/render/pro-clarity-transform';
import { isSmartFilterActive } from '@core/render/smart-filter-transform';

type BuiltExportRequest = ExportRequest & {
  readonly rotation: 0 | 90 | 180 | 270;
  readonly crop: EditState['crop'];
  readonly outputFormat: Extract<ExportFormat, 'jpeg' | 'png'>;
};

interface AssetExportOptions {
  readonly quality?: number;
  readonly selectedPresetId?: string | null;
  readonly lutIntensity?: number;
}

export function buildExportRequest(
  state: EditState,
  format: Extract<ExportFormat, 'jpeg' | 'png'>,
): BuiltExportRequest {
  assertSafeExportSourceUri(state.assetUri);
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

  if (isArtisticLookActive(state.artisticLook)) {
    transforms.push({ type: 'artistic-look', params: state.artisticLook! });
  }

  if (isSmartFilterActive(state.smartFilter)) {
    transforms.push({ type: 'smart-filter', params: state.smartFilter! });
  }

  if (isProClarityActive(state.proClarity)) {
    transforms.push({ type: 'pro-clarity', params: state.proClarity! });
  }

  if (state.blend) {
    transforms.push({ type: 'blend', params: state.blend });
  }

  const transformedDimensions = getTransformedDimensions({
    width: state.assetWidth,
    height: state.assetHeight,
    rotation: state.rotation,
    crop: state.crop,
  });

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

export function buildAssetExportRequest(
  asset: ImageAsset,
  format: Extract<ExportFormat, 'jpeg' | 'png'>,
  options: AssetExportOptions = {},
): BuiltExportRequest {
  assertSafeExportSourceUri(asset.uri);
  const transforms: Transform[] = [];

  if (options.selectedPresetId) {
    transforms.push({
      type: 'lut',
      presetId: options.selectedPresetId,
      intensity: options.lutIntensity,
    });
  }

  return {
    asset,
    transforms,
    format,
    quality: options.quality ?? 0.95,
    targetWidth: asset.width,
    targetHeight: asset.height,
    includeMetadata: true,
    rotation: 0,
    crop: null,
    outputFormat: format,
  };
}

export function assertSafeExportSourceUri(uri: string): void {
  if (
    uri.startsWith('ph://') ||
    uri.startsWith('content://') ||
    uri.startsWith('file://')
  ) {
    return;
  }

  throw ExportErrors.INVALID_SOURCE_URI(uri);
}

function getTransformedDimensions(params: {
  readonly width: number;
  readonly height: number;
  readonly rotation: 0 | 90 | 180 | 270;
  readonly crop: EditState['crop'];
}): {
  readonly width: number;
  readonly height: number;
} {
  let width = params.width;
  let height = params.height;

  if (params.rotation === 90 || params.rotation === 270) {
    [width, height] = [height, width];
  }

  if (params.crop) {
    width = Math.max(1, Math.round(width * params.crop.width));
    height = Math.max(1, Math.round(height * params.crop.height));
  }

  return { width, height };
}
