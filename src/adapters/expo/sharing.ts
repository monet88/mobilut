import * as Sharing from 'expo-sharing';

export async function shareFile(uri: string, mimeType?: string): Promise<void> {
  await Sharing.shareAsync(uri, {
    mimeType,
  });
}

export async function isSharingAvailable(): Promise<boolean> {
  return Sharing.isAvailableAsync();
}
