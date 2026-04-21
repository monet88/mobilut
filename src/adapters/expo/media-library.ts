import * as MediaLibrary from 'expo-media-library';

import { ExportErrors } from '@core/errors';

export interface LibraryPermissionResult {
  readonly granted: boolean;
  readonly status: 'granted' | 'denied' | 'undetermined';
}

export interface LibraryPhotoAsset {
  readonly id: string;
  readonly uri: string;
  readonly width: number;
  readonly height: number;
}

export interface LibraryAlbum {
  readonly id: string;
  readonly title: string;
  readonly assetCount: number;
}

function toPermissionResult(
  permission: Awaited<ReturnType<typeof MediaLibrary.requestPermissionsAsync>>,
): LibraryPermissionResult {
  return {
    granted: permission.granted,
    status:
      permission.status === 'granted' ||
      permission.status === 'denied' ||
      permission.status === 'undetermined'
        ? permission.status
        : 'undetermined',
  };
}

function toLibraryPhotoAsset(asset: MediaLibrary.Asset): LibraryPhotoAsset {
  return {
    id: asset.id,
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  };
}

function toLibraryAlbum(album: MediaLibrary.Album): LibraryAlbum {
  return {
    id: album.id,
    title: album.title,
    assetCount: album.assetCount ?? 0,
  };
}

export async function requestPhotoLibraryPermission(): Promise<LibraryPermissionResult> {
  return toPermissionResult(await MediaLibrary.requestPermissionsAsync());
}

export async function getRecentPhotoAssets(limit = 100): Promise<readonly LibraryPhotoAsset[]> {
  const result = await MediaLibrary.getAssetsAsync({
    first: limit,
    mediaType: 'photo',
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  });

  return result.assets.map(toLibraryPhotoAsset);
}

export async function getAlbums(): Promise<readonly LibraryAlbum[]> {
  const albums = await MediaLibrary.getAlbumsAsync();
  return albums.map(toLibraryAlbum);
}

export async function getAlbumPhotoAssets(
  album: LibraryAlbum,
  limit = 100,
): Promise<readonly LibraryPhotoAsset[]> {
  const result = await MediaLibrary.getAssetsAsync({
    first: limit,
    mediaType: 'photo',
    album: album as MediaLibrary.Album,
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
  });

  return result.assets.map(toLibraryPhotoAsset);
}

export async function saveImageToGallery(uri: string): Promise<string> {
  try {
    const permission = await requestPhotoLibraryPermission();

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
