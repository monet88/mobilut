import * as MediaLibrary from 'expo-media-library';

import { ExportErrors } from '@core/errors';

export async function saveImageToGallery(uri: string): Promise<string> {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync();

    if (!permission.granted) {
      throw ExportErrors.PERMISSION_DENIED();
    }

    const asset = await MediaLibrary.createAssetAsync(uri);
    return asset.uri;
  } catch (error) {
    if (error instanceof Error && error.name === 'ExportImageError') {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown media library failure';
    throw ExportErrors.WRITE_FAILED(message);
  }
}
