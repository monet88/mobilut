import {
  copyFile,
  deleteFile,
  ensureDirectory,
  getCacheDirectory,
  getFileInfo,
} from '@adapters/expo/file-system';
import { resizeImage } from '@adapters/expo/image-manipulator';

const THUMBNAIL_CACHE_DIR = `${getCacheDirectory()}batch-thumbnails/`;
const THUMBNAIL_SIZE = 200;
let ensureCacheDirPromise: Promise<void> | null = null;

async function ensureCacheDir(): Promise<void> {
  if (!ensureCacheDirPromise) {
    ensureCacheDirPromise = (async () => {
      const info = await getFileInfo(THUMBNAIL_CACHE_DIR);
      if (!info.exists) {
        await ensureDirectory(THUMBNAIL_CACHE_DIR);
      }
    })().catch((error) => {
      ensureCacheDirPromise = null;
      throw error;
    });
  }

  await ensureCacheDirPromise;
}

function toThumbnailUri(photoId: string): string {
  const safePhotoId = photoId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${THUMBNAIL_CACHE_DIR}${safePhotoId}.jpg`;
}

export async function generateThumbnail(photoId: string, sourceUri: string): Promise<string> {
  await ensureCacheDir();

  const thumbnailUri = toThumbnailUri(photoId);
  const info = await getFileInfo(thumbnailUri);

  if (info.exists) {
    return thumbnailUri;
  }

  const resultUri = await resizeImage(sourceUri, {
    maxWidth: THUMBNAIL_SIZE,
    quality: 0.7,
    format: 'jpeg',
  });

  await copyFile(resultUri, thumbnailUri);
  return thumbnailUri;
}

export async function getThumbnail(photoId: string): Promise<string | null> {
  const thumbnailUri = toThumbnailUri(photoId);
  const info = await getFileInfo(thumbnailUri);
  return info.exists ? thumbnailUri : null;
}

export async function clearThumbnailCache(): Promise<void> {
  const info = await getFileInfo(THUMBNAIL_CACHE_DIR);
  if (info.exists) {
    await deleteFile(THUMBNAIL_CACHE_DIR);
    ensureCacheDirPromise = null;
  }
}

export async function clearThumbnail(photoId: string): Promise<void> {
  const thumbnailUri = toThumbnailUri(photoId);
  const info = await getFileInfo(thumbnailUri);
  if (info.exists) {
    await deleteFile(thumbnailUri);
  }
}
