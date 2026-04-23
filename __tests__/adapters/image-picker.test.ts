import * as ImagePicker from 'expo-image-picker';

import { pickImageFromLibrary } from '@adapters/expo/image-picker';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));

const mockedLaunchImageLibraryAsync = jest.mocked(ImagePicker.launchImageLibraryAsync);
const mockedRequestMediaLibraryPermissionsAsync = jest.mocked(
  ImagePicker.requestMediaLibraryPermissionsAsync,
);

describe('pickImageFromLibrary', () => {
  beforeEach(() => {
    mockedRequestMediaLibraryPermissionsAsync.mockReset();
    mockedLaunchImageLibraryAsync.mockReset();
    mockedRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: true,
    } as never);
  });

  it('launches the library picker directly and returns a normalized asset', async () => {
    mockedLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          assetId: 'asset-1',
          uri: 'file:///photo.jpg',
          width: 1200,
          height: 900,
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          fileSize: 123,
        },
      ],
    } as never);

    await expect(pickImageFromLibrary()).resolves.toEqual({
      id: 'asset-1',
      uri: 'file:///photo.jpg',
      width: 1200,
      height: 900,
      format: 'jpeg',
      fileSize: 123,
    });

    expect(mockedLaunchImageLibraryAsync).toHaveBeenCalledTimes(1);
  });

  it('throws a typed permission error when media library access is denied', async () => {
    mockedRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      granted: false,
    } as never);

    await expect(pickImageFromLibrary()).rejects.toMatchObject({
      name: 'ImportImageError',
      code: 'IMPORT_PERMISSION_DENIED',
    });

    expect(mockedLaunchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('returns null when the user cancels the picker', async () => {
    mockedLaunchImageLibraryAsync.mockResolvedValue({
      canceled: true,
      assets: null,
    } as never);

    await expect(pickImageFromLibrary()).resolves.toBeNull();
  });
});
