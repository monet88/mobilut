import { cropImage, resizeImage, rotateImage, saveImage } from '@adapters/expo/image-manipulator';
import { ExportErrors } from '@core/errors/export-errors';
import type { CropParams } from '@core/edit-session/edit-state';
import type { ExportRequest, Transform } from '@core/image-pipeline';
import { MAX_EXPORT_DIMENSION, MAX_EXPORT_PIXELS } from '@core/image-pipeline/pipeline-constraints';

export interface ExportRenderResult {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  readonly format: 'jpeg' | 'png';
}

type ExtendedExportRequest = ExportRequest & {
  readonly rotation?: 0 | 90 | 180 | 270;
  readonly crop?: CropParams | null;
  readonly outputFormat?: 'jpeg' | 'png';
};

export async function renderExport(request: ExportRequest): Promise<ExportRenderResult> {
  const extendedRequest = request as ExtendedExportRequest;
  const requestedWidth = Math.max(request.asset.width, request.targetWidth);
  const requestedHeight = Math.max(request.asset.height, request.targetHeight);

  if (requestedWidth > MAX_EXPORT_DIMENSION || requestedHeight > MAX_EXPORT_DIMENSION) {
    throw ExportErrors.DIMENSION_TOO_LARGE(requestedWidth, requestedHeight);
  }

  if (requestedWidth * requestedHeight > MAX_EXPORT_PIXELS) {
    throw ExportErrors.OUT_OF_MEMORY(requestedWidth * requestedHeight);
  }

  let currentUri = request.asset.uri;
  let currentWidth = request.asset.width;
  let currentHeight = request.asset.height;
  const rotation = getRotation(extendedRequest);
  const crop = getCrop(extendedRequest);
  const outputFormat = getOutputFormat(extendedRequest);
  let finalizedOutput = false;

  if (rotation !== 0) {
    currentUri = await rotateImage(currentUri, rotation);

    if (rotation === 90 || rotation === 270) {
      [currentWidth, currentHeight] = [currentHeight, currentWidth];
    }
  }

  if (crop) {
    const cropX = Math.round(crop.x * currentWidth);
    const cropY = Math.round(crop.y * currentHeight);
    const cropWidth = Math.max(1, Math.round(crop.width * currentWidth));
    const cropHeight = Math.max(1, Math.round(crop.height * currentHeight));

    currentUri = await cropImage(currentUri, cropX, cropY, cropWidth, cropHeight);
    currentWidth = cropWidth;
    currentHeight = cropHeight;
  }

  if (request.targetWidth > 0 && request.targetHeight > 0) {
    if (request.targetWidth !== currentWidth || request.targetHeight !== currentHeight) {
      currentUri = await resizeImage(currentUri, {
        maxWidth: request.targetWidth,
        maxHeight: request.targetHeight,
        quality: request.quality,
        format: outputFormat,
      });
      currentWidth = request.targetWidth;
      currentHeight = request.targetHeight;
      finalizedOutput = true;
    }
  }

  if (!finalizedOutput) {
    currentUri = await saveImage(currentUri, {
      quality: request.quality,
      format: outputFormat,
    });
  }

  return {
    uri: currentUri,
    width: currentWidth,
    height: currentHeight,
    format: outputFormat,
  };
}

function getRotation(request: ExtendedExportRequest): 0 | 90 | 180 | 270 {
  if (
    request.rotation === 0 ||
    request.rotation === 90 ||
    request.rotation === 180 ||
    request.rotation === 270
  ) {
    return request.rotation;
  }

  const rotateTransform = request.transforms.find(
    (transform): transform is Extract<Transform, { readonly type: 'rotate' }> =>
      transform.type === 'rotate',
  );

  return rotateTransform?.degrees ?? 0;
}

function getCrop(request: ExtendedExportRequest): CropParams | null {
  if (request.crop) {
    return request.crop;
  }

  const cropTransform = request.transforms.find(
    (transform): transform is Extract<Transform, { readonly type: 'crop' }> =>
      transform.type === 'crop',
  );

  return cropTransform?.params ?? null;
}

function getOutputFormat(request: ExtendedExportRequest): 'jpeg' | 'png' {
  if (request.outputFormat === 'jpeg' || request.outputFormat === 'png') {
    return request.outputFormat;
  }

  if (request.format === 'png') {
    return 'png';
  }

  return 'jpeg';
}
