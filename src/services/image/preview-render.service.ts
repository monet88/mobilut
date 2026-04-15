import type { EditState } from '@core/edit-session/edit-state';
import { DEFAULT_ADJUSTMENTS } from '@core/edit-session/edit-state';
import type { PreviewRequest, Transform } from '@core/image-pipeline';
import { MAX_PREVIEW_DIMENSION } from '@core/image-pipeline/pipeline-constraints';

export interface PreviewRenderResult {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
}

type ExtendedPreviewRequest = PreviewRequest & {
  readonly maxDimension?: number;
};

export async function renderPreview(request: PreviewRequest): Promise<PreviewRenderResult> {
  const extendedRequest = request as ExtendedPreviewRequest;
  const maxDimension = extendedRequest.maxDimension ?? MAX_PREVIEW_DIMENSION;
  const scale = Math.min(1, maxDimension / Math.max(request.asset.width, request.asset.height));

  return {
    uri: request.asset.uri,
    width: Math.round(request.asset.width * scale),
    height: Math.round(request.asset.height * scale),
  };
}

export function buildPreviewRequest(state: EditState): PreviewRequest {
  const maxDimension = MAX_PREVIEW_DIMENSION;
  const scale = Math.min(1, maxDimension / Math.max(state.assetWidth, state.assetHeight));
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
    transforms.push({ type: 'custom-lut', lutId: 'custom-import' });
  }

  if (hasNonDefaultAdjustments(state)) {
    transforms.push({ type: 'adjust', params: state.adjustments });
  }

  if (state.regionMask) {
    transforms.push({ type: 'region-mask', mask: state.regionMask });
  }

  if (state.framing) {
    transforms.push({ type: 'framing', params: state.framing });
  }

  if (state.watermark) {
    transforms.push({ type: 'watermark', params: state.watermark });
  }

  const request: ExtendedPreviewRequest = {
    asset: {
      id: state.assetId,
      uri: state.assetUri,
      width: state.assetWidth,
      height: state.assetHeight,
      format: 'jpeg',
      fileSize: null,
    },
    transforms,
    targetWidth: Math.round(state.assetWidth * scale),
    targetHeight: Math.round(state.assetHeight * scale),
    pixelRatio: 1,
    maxDimension,
  };

  return request;
}

function hasNonDefaultAdjustments(state: EditState): boolean {
  return (
    state.adjustments.intensity !== DEFAULT_ADJUSTMENTS.intensity ||
    state.adjustments.temperature !== DEFAULT_ADJUSTMENTS.temperature ||
    state.adjustments.brightness !== DEFAULT_ADJUSTMENTS.brightness ||
    state.adjustments.contrast !== DEFAULT_ADJUSTMENTS.contrast ||
    state.adjustments.saturation !== DEFAULT_ADJUSTMENTS.saturation ||
    state.adjustments.sharpen !== DEFAULT_ADJUSTMENTS.sharpen
  );
}
