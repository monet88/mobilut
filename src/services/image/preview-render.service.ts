import type { EditState } from '@core/edit-session/edit-state';
import { DEFAULT_ADJUSTMENTS } from '@core/edit-session/edit-state';
import type { PreviewRequest, Transform } from '@core/image-pipeline';
import { MAX_PREVIEW_DIMENSION } from '@core/image-pipeline/pipeline-constraints';
import { hasProClarityApplied } from '@core/stylistic/pro-clarity-model';
import { cropImage, resizeImage, rotateImage } from '@adapters/expo/image-manipulator';

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
  let currentUri = request.asset.uri;
  let currentWidth = request.asset.width;
  let currentHeight = request.asset.height;
  const rotation = getRotation(request.transforms);
  const crop = getCrop(request.transforms);

  if (rotation !== 0) {
    currentUri = await rotateImage(currentUri, rotation);

    if (rotation === 90 || rotation === 270) {
      [currentWidth, currentHeight] = [currentHeight, currentWidth];
    }
  }

  if (crop) {
    const cropX = clampToRange(Math.round(crop.x * currentWidth), 0, Math.max(0, currentWidth - 1));
    const cropY = clampToRange(Math.round(crop.y * currentHeight), 0, Math.max(0, currentHeight - 1));
    const cropWidth = clampToRange(
      Math.round(crop.width * currentWidth),
      1,
      Math.max(1, currentWidth - cropX),
    );
    const cropHeight = clampToRange(
      Math.round(crop.height * currentHeight),
      1,
      Math.max(1, currentHeight - cropY),
    );

    currentUri = await cropImage(currentUri, cropX, cropY, cropWidth, cropHeight);
    currentWidth = cropWidth;
    currentHeight = cropHeight;
  }

  const scale = Math.min(1, maxDimension / Math.max(currentWidth, currentHeight));
  const targetWidth = Math.max(1, Math.round(currentWidth * scale));
  const targetHeight = Math.max(1, Math.round(currentHeight * scale));

  if (targetWidth !== currentWidth || targetHeight !== currentHeight) {
    currentUri = await resizeImage(currentUri, {
      maxWidth: targetWidth,
      maxHeight: targetHeight,
      quality: 0.8,
    });
    currentWidth = targetWidth;
    currentHeight = targetHeight;
  }

  return {
    uri: currentUri,
    width: currentWidth,
    height: currentHeight,
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

  if (state.artisticLook) {
    transforms.push({ type: 'artistic-look', params: state.artisticLook });
  }

  if (state.smartFilter?.enabled) {
    transforms.push({ type: 'smart-filter', params: state.smartFilter });
  }

  if (state.proClarity && hasProClarityApplied(state.proClarity)) {
    transforms.push({ type: 'pro-clarity', params: state.proClarity });
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

function getRotation(transforms: readonly Transform[]): 0 | 90 | 180 | 270 {
  const rotateTransform = transforms.find(
    (transform): transform is Extract<Transform, { readonly type: 'rotate' }> =>
      transform.type === 'rotate',
  );

  return rotateTransform?.degrees ?? 0;
}

function getCrop(
  transforms: readonly Transform[],
): Extract<Transform, { readonly type: 'crop' }>['params'] | null {
  const cropTransform = transforms.find(
    (transform): transform is Extract<Transform, { readonly type: 'crop' }> =>
      transform.type === 'crop',
  );

  return cropTransform?.params ?? null;
}

function clampToRange(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
