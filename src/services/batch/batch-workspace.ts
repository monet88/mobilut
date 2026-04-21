import type { BatchPhoto, BatchWorkspace } from '@core/batch';
import { createBatchWorkspace, MAX_BATCH_PHOTOS } from '@core/batch';

import { clearThumbnail, generateThumbnail } from './thumbnail-cache';

export interface PhotoSelection {
  readonly id: string;
  readonly uri: string;
  readonly width: number;
  readonly height: number;
}

export async function createWorkspaceWithPhotos(
  selections: readonly PhotoSelection[],
): Promise<BatchWorkspace> {
  if (selections.length > MAX_BATCH_PHOTOS) {
    throw new Error(`Cannot add more than ${MAX_BATCH_PHOTOS} photos to batch`);
  }

  const workspace = createBatchWorkspace();
  const photos: BatchPhoto[] = [];

  for (const selection of selections) {
    const thumbnailUri = await generateThumbnail(selection.id, selection.uri);
    photos.push({
      id: selection.id,
      uri: selection.uri,
      width: selection.width,
      height: selection.height,
      thumbnailUri,
      status: 'pending',
      error: null,
    });
  }

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
  const totalCount = workspace.photos.length + selections.length;
  if (totalCount > MAX_BATCH_PHOTOS) {
    throw new Error(`Cannot add more than ${MAX_BATCH_PHOTOS} photos to batch`);
  }

  const newPhotos: BatchPhoto[] = [];
  for (const selection of selections) {
    const thumbnailUri = await generateThumbnail(selection.id, selection.uri);
    newPhotos.push({
      id: selection.id,
      uri: selection.uri,
      width: selection.width,
      height: selection.height,
      thumbnailUri,
      status: 'pending',
      error: null,
    });
  }

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
