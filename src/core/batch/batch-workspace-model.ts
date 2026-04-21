export const MAX_BATCH_PHOTOS = 20;

export interface BatchPhoto {
  readonly id: string;
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  readonly thumbnailUri: string | null;
  readonly status: 'pending' | 'processing' | 'completed' | 'failed';
  readonly error: string | null;
}

export interface BatchWorkspace {
  readonly id: string;
  readonly photos: readonly BatchPhoto[];
  readonly selectedPhotoId: string | null;
  readonly appliedPresetId: string | null;
  readonly appliedIntensity: number;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface BatchExportOptions {
  readonly format: 'jpeg' | 'png';
  readonly quality: number;
  readonly preserveOriginalSize: boolean;
}

export function createBatchWorkspace(): BatchWorkspace {
  return {
    id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    photos: [],
    selectedPhotoId: null,
    appliedPresetId: null,
    appliedIntensity: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function canAddPhotos(workspace: BatchWorkspace, count: number): boolean {
  return workspace.photos.length + count <= MAX_BATCH_PHOTOS;
}
