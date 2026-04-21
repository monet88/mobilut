import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const THUMBNAIL_CACHE_DIR = `${FileSystem.cacheDirectory}batch-thumbnails/`;
const THUMBNAIL_SIZE = 200;

async function ensureCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(THUMBNAIL_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(THUMBNAIL_CACHE_DIR, { intermediates: true });
  }
}

export async function generateThumbnail(photoId: string, sourceUri: string): Promise<string> {
  await ensureCacheDir();

  const thumbnailUri = `${THUMBNAIL_CACHE_DIR}${photoId}.jpg`;
  const info = await FileSystem.getInfoAsync(thumbnailUri);

  if (info.exists) {
    return thumbnailUri;
  }

  const result = await ImageManipulator.manipulateAsync(
    sourceUri,
    [{ resize: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );

  await FileSystem.copyAsync({ from: result.uri, to: thumbnailUri });
  return thumbnailUri;
}

export async function getThumbnail(photoId: string): Promise<string | null> {
  const thumbnailUri = `${THUMBNAIL_CACHE_DIR}${photoId}.jpg`;
  const info = await FileSystem.getInfoAsync(thumbnailUri);
  return info.exists ? thumbnailUri : null;
}

export async function clearThumbnailCache(): Promise<void> {
  const info = await FileSystem.getInfoAsync(THUMBNAIL_CACHE_DIR);
  if (info.exists) {
    await FileSystem.deleteAsync(THUMBNAIL_CACHE_DIR, { idempotent: true });
  }
}

export async function clearThumbnail(photoId: string): Promise<void> {
  const thumbnailUri = `${THUMBNAIL_CACHE_DIR}${photoId}.jpg`;
  const info = await FileSystem.getInfoAsync(thumbnailUri);
  if (info.exists) {
    await FileSystem.deleteAsync(thumbnailUri, { idempotent: true });
  }
}
