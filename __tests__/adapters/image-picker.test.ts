import * as ImagePicker from 'expo-image-picker';

import { pickImageFromLibrary } from '@adapters/expo/image-picker';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
}));

const mockedLaunchImageLibraryAsync = jest.mocked(ImagePicker.launchImageLibraryAsync);

describe('pickImageFromLibrary', () => {
  beforeEach(() => {
    mockedLaunchImageLibraryAsync.mockReset();
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
});
