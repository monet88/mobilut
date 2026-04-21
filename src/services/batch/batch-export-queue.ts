import type {
  BatchExportOptions,
  BatchExportProgress,
  BatchPhoto,
  BatchWorkspace,
} from '@core/batch';
import * as MediaLibrary from 'expo-media-library';

export type ExportProgressCallback = (progress: BatchExportProgress) => void;

export interface BatchExportResult {
  readonly successful: readonly string[];
  readonly failed: readonly { photoId: string; error: string }[];
}

async function exportSinglePhoto(
  photo: BatchPhoto,
  _workspace: BatchWorkspace,
  _options: BatchExportOptions,
): Promise<void> {
  await MediaLibrary.saveToLibraryAsync(photo.uri);
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
