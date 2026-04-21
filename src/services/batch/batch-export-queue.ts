import type {
  BatchExportOptions,
  BatchExportProgress,
  BatchPhoto,
  BatchWorkspace,
} from '@core/batch';
import { deleteFile } from '@adapters/expo/file-system';
import { saveImageToGallery } from '@adapters/expo/media-library';
import {
  assertSafeExportSourceUri,
  buildAssetExportRequest,
} from '@services/image/export-request-builder';
import { renderExport } from '@services/image/export-render.service';
import { renderPresetImage } from '@services/image/preset-render.service';

export type ExportProgressCallback = (progress: BatchExportProgress) => void;

export interface BatchExportResult {
  readonly successful: readonly string[];
  readonly failed: readonly { photoId: string; error: string }[];
}

async function exportSinglePhoto(
  photo: BatchPhoto,
  workspace: BatchWorkspace,
  options: BatchExportOptions,
): Promise<void> {
  assertSafeExportSourceUri(photo.uri);

  const preparedImage = workspace.appliedPresetId
    ? await renderPresetImage(photo, workspace, options)
    : { uri: photo.uri, cleanupUris: [] };
  let renderedUri: string | null = null;

  try {
    const result = await renderExport(
      buildAssetExportRequest(
        {
          id: photo.id,
          uri: preparedImage.uri,
          width: photo.width,
          height: photo.height,
          format: 'jpeg',
          fileSize: null,
        },
        options.format,
        {
          quality: options.quality,
        },
      ),
    );

    renderedUri = result.uri;
    await saveImageToGallery(result.uri);
  } finally {
    await cleanupTemporaryFiles([
      ...preparedImage.cleanupUris,
      ...(renderedUri ? [renderedUri] : []),
    ]);
  }
}

export async function exportBatch(
  workspace: BatchWorkspace,
  options: BatchExportOptions,
  onProgress: ExportProgressCallback,
): Promise<BatchExportResult> {
  const successful: string[] = [];
  const failed: { photoId: string; error: string }[] = [];

  const total = workspace.photos.length;
  let completed = 0;
  let failedCount = 0;

  for (const photo of workspace.photos) {
    onProgress({
      total,
      completed,
      failed: failedCount,
      currentPhotoId: photo.id,
    });

    try {
      await exportSinglePhoto(photo, workspace, options);
      successful.push(photo.id);
      completed += 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      failed.push({ photoId: photo.id, error: errorMessage });
      failedCount += 1;
    }

    onProgress({
      total,
      completed,
      failed: failedCount,
      currentPhotoId: null,
    });
  }

  return { successful, failed };
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
