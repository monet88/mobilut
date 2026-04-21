import type { BatchPhoto, BatchWorkspace } from '@core/batch';
import { createBatchWorkspace, MAX_BATCH_PHOTOS } from '@core/batch';

import { clearThumbnail, generateThumbnail } from './thumbnail-cache';

export interface PhotoSelection {
  readonly id: string;
  readonly uri: string;
  readonly width: number;
  readonly height: number;
}

const THUMBNAIL_CONCURRENCY = 4;

async function mapSelectionsWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );

  return results;
}

async function createBatchPhoto(selection: PhotoSelection): Promise<BatchPhoto> {
  const thumbnailUri = await generateThumbnail(selection.id, selection.uri);
  return {
    id: selection.id,
    uri: selection.uri,
    width: selection.width,
    height: selection.height,
    thumbnailUri,
    status: 'pending',
    error: null,
  };
}

export async function createWorkspaceWithPhotos(
  selections: readonly PhotoSelection[],
): Promise<BatchWorkspace> {
  if (selections.length > MAX_BATCH_PHOTOS) {
    throw new Error(`Cannot add more than ${MAX_BATCH_PHOTOS} photos to batch`);
  }

  const workspace = createBatchWorkspace();
  const photos = await mapSelectionsWithConcurrency(
    selections,
    THUMBNAIL_CONCURRENCY,
    createBatchPhoto,
  );

  return {
    ...workspace,
    photos,
    selectedPhotoId: photos[0]?.id ?? null,
  };
}

export async function addPhotosToWorkspace(
  workspace: BatchWorkspace,
  selections: readonly PhotoSelection[],
): Promise<BatchWorkspace> {
  const existingPhotoIds = new Set(workspace.photos.map((photo) => photo.id));
  const incomingPhotoIds = new Set<string>();
  const uniqueSelections = selections.filter((selection) => {
    if (existingPhotoIds.has(selection.id) || incomingPhotoIds.has(selection.id)) {
      return false;
    }

    incomingPhotoIds.add(selection.id);
    return true;
  });

  const totalCount = workspace.photos.length + uniqueSelections.length;
  if (totalCount > MAX_BATCH_PHOTOS) {
    throw new Error(`Cannot add more than ${MAX_BATCH_PHOTOS} photos to batch`);
  }

  if (uniqueSelections.length === 0) {
    return workspace;
  }

  const newPhotos = await mapSelectionsWithConcurrency(
    uniqueSelections,
    THUMBNAIL_CONCURRENCY,
    createBatchPhoto,
  );

  return {
    ...workspace,
    photos: [...workspace.photos, ...newPhotos],
    updatedAt: Date.now(),
  };
}

export async function removePhotoFromWorkspace(
  workspace: BatchWorkspace,
  photoId: string,
): Promise<BatchWorkspace> {
  await clearThumbnail(photoId);

  const photos = workspace.photos.filter((p) => p.id !== photoId);
  const selectedPhotoId =
    workspace.selectedPhotoId === photoId ? photos[0]?.id ?? null : workspace.selectedPhotoId;

  return {
    ...workspace,
    photos,
    selectedPhotoId,
    updatedAt: Date.now(),
  };
}

export function selectPhoto(workspace: BatchWorkspace, photoId: string): BatchWorkspace {
  if (!workspace.photos.some((p) => p.id === photoId)) {
    return workspace;
  }

  return {
    ...workspace,
    selectedPhotoId: photoId,
    updatedAt: Date.now(),
  };
}

export function applyPreset(
  workspace: BatchWorkspace,
  presetId: string | null,
  intensity: number,
): BatchWorkspace {
  return {
    ...workspace,
    appliedPresetId: presetId,
    appliedIntensity: intensity,
    updatedAt: Date.now(),
  };
}
