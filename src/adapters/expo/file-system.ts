import * as FileSystem from 'expo-file-system';

export async function readFileAsText(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri);
}

export async function readFileAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function writeFile(uri: string, content: string): Promise<void> {
  await FileSystem.writeAsStringAsync(uri, content);
}

export async function writeBase64File(uri: string, content: string): Promise<void> {
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function copyFile(from: string, to: string): Promise<void> {
  await FileSystem.copyAsync({ from, to });
}

export async function ensureDirectory(uri: string): Promise<void> {
  await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
}

export async function deleteFile(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function getFileInfo(uri: string): Promise<{ exists: boolean; size?: number }> {
  const info = await FileSystem.getInfoAsync(uri, { size: true });

  return info.exists
    ? {
        exists: true,
        size: typeof info.size === 'number' ? info.size : undefined,
      }
    : { exists: false };
}

export function getCacheDirectory(): string {
  return FileSystem.cacheDirectory ?? '';
}

export function getDocumentDirectory(): string {
  return FileSystem.documentDirectory ?? '';
}
