import AsyncStorage from '@react-native-async-storage/async-storage';

import { getRecentItems } from '@services/storage/recent-items';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('recent-items', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty list when stored JSON is malformed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('{bad json');

    await expect(getRecentItems()).resolves.toEqual([]);
  });

  it('returns an empty list when AsyncStorage read fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('storage offline'));

    await expect(getRecentItems()).resolves.toEqual([]);
  });
});
