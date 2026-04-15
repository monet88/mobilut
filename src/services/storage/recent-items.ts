import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ImageAsset } from '@core/image-pipeline';

const RECENT_ITEMS_KEY = '@lut-app/recentItems';
const MAX_RECENT_ITEMS = 20;

export async function getRecentItems(): Promise<ImageAsset[]> {
  try {
    const json = await AsyncStorage.getItem(RECENT_ITEMS_KEY);

    if (!json) {
      return [];
    }

    return JSON.parse(json) as ImageAsset[];
  } catch {
    return [];
  }
}

export async function addRecentItem(asset: ImageAsset): Promise<void> {
  const items = await getRecentItems();
  const filtered = items.filter((item) => item.id !== asset.id);
  const updated = [asset, ...filtered].slice(0, MAX_RECENT_ITEMS);

  await AsyncStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
}

export async function clearRecentItems(): Promise<void> {
  await AsyncStorage.removeItem(RECENT_ITEMS_KEY);
}
