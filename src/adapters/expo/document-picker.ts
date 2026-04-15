import * as DocumentPicker from 'expo-document-picker';

import { ImportErrors } from '@core/errors';

export interface PickedDocument {
  readonly uri: string;
  readonly name: string;
  readonly mimeType: string | null;
  readonly size: number | null;
}

function toPickedDocument(asset: DocumentPicker.DocumentPickerAsset): PickedDocument {
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? null,
    size: asset.size ?? null,
  };
}

async function pickDocument(type: string | string[]): Promise<PickedDocument | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type,
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      return null;
    }

    const [asset] = result.assets;

    return asset ? toPickedDocument(asset) : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown document picker failure';
    throw ImportErrors.INVALID_IMAGE(message);
  }
}

export async function pickCubeFile(): Promise<PickedDocument | null> {
  return pickDocument(['application/octet-stream', 'text/plain', '.cube']);
}

export async function pickHaldFile(): Promise<PickedDocument | null> {
  return pickDocument(['image/png', '.png']);
}
