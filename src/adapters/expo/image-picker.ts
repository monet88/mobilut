import * as ImagePicker from 'expo-image-picker';

import { ImportErrors } from '@core/errors';
import type { ImageAsset, ImageFormat } from '@core/image-pipeline';

function getImageFormat(
  fileName: string | null | undefined,
  mimeType: string | null | undefined,
): ImageFormat {
  const normalizedMimeType = mimeType?.toLowerCase();
  if (normalizedMimeType === 'image/jpeg') {
    return 'jpeg';
  }

  if (normalizedMimeType === 'image/png') {
    return 'png';
  }

  if (normalizedMimeType === 'image/webp') {
    return 'webp';
  }

  if (normalizedMimeType === 'image/heic' || normalizedMimeType === 'image/heif') {
    return 'heic';
  }

  const normalizedFileName = fileName?.toLowerCase() ?? '';

  if (normalizedFileName.endsWith('.jpg') || normalizedFileName.endsWith('.jpeg')) {
    return 'jpeg';
  }

  if (normalizedFileName.endsWith('.png')) {
    return 'png';
  }

  if (normalizedFileName.endsWith('.webp')) {
    return 'webp';
  }

  if (normalizedFileName.endsWith('.heic') || normalizedFileName.endsWith('.heif')) {
    return 'heic';
  }

  return 'unknown';
}

function toImageAsset(asset: ImagePicker.ImagePickerAsset): ImageAsset {
  const id = asset.assetId ?? asset.uri;

  return {
    id,
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    format: getImageFormat(asset.fileName, asset.mimeType),
    fileSize: asset.fileSize ?? null,
  };
}

export async function pickImageFromLibrary(): Promise<ImageAsset | null> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      exif: true,
      allowsMultipleSelection: false,
      selectionLimit: 1,
    });

    if (result.canceled) {
      return null;
    }

    const [asset] = result.assets;

    if (!asset) {
      throw ImportErrors.INVALID_IMAGE('No image asset returned from picker');
    }

    return toImageAsset(asset);
  } catch (error) {
    if (error instanceof Error && error.name === 'ImportImageError') {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown image picker failure';
    throw ImportErrors.INVALID_IMAGE(message);
  }
}
