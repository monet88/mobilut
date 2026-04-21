import type { BatchExportOptions, BatchPhoto, BatchWorkspace } from '@core/batch';
import { ExportErrors } from '@core/errors';
import { getPresetColorMatrix } from '@core/lut';
import { saveImage } from '@adapters/expo/image-manipulator';
import {
  deleteFile,
  getCacheDirectory,
  readFileAsBase64,
  writeBase64File,
} from '@adapters/expo/file-system';
import { renderBase64ImageWithColorMatrix } from '@adapters/skia';

function getBatchPresetOutputUri(photoId: string, format: 'jpeg' | 'png'): string {
  const safePhotoId = photoId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const extension = format === 'png' ? 'png' : 'jpg';
  return `${getCacheDirectory()}batch-export-${safePhotoId}-${Date.now()}.${extension}`;
}

export async function renderPresetImage(
  photo: BatchPhoto,
  workspace: BatchWorkspace,
  options: BatchExportOptions,
): Promise<{
  readonly uri: string;
  readonly cleanupUris: readonly string[];
}> {
  const presetId = workspace.appliedPresetId;
  if (!presetId) {
    return {
      uri: photo.uri,
      cleanupUris: [],
    };
  }

  const colorMatrix = getPresetColorMatrix(presetId);
  if (!colorMatrix) {
    throw ExportErrors.WRITE_FAILED(`Preset ${presetId} is not available for export rendering`);
  }

  const cleanupUris: string[] = [];

  try {
    const materializedUri = await saveImage(photo.uri, {
      quality: 1,
      format: 'jpeg',
    });
    cleanupUris.push(materializedUri);

    const sourceBase64 = await readFileAsBase64(materializedUri);
    const renderedBase64 = renderBase64ImageWithColorMatrix({
      sourceBase64,
      width: photo.width,
      height: photo.height,
      colorMatrix,
      intensity: workspace.appliedIntensity,
      format: options.format,
      quality: options.quality,
    });

    const outputUri = getBatchPresetOutputUri(photo.id, options.format);
    await writeBase64File(outputUri, renderedBase64);
    cleanupUris.push(outputUri);

    return {
      uri: outputUri,
      cleanupUris,
    };
  } catch (error) {
    await cleanupTemporaryFiles(cleanupUris);
    throw error;
  }
}

async function cleanupTemporaryFiles(uris: readonly string[]): Promise<void> {
  await Promise.all(
    uris.map(async (uri) => {
      try {
        await deleteFile(uri);
      } catch {
        // best-effort cleanup only
      }
    }),
  );
}
