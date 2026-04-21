import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockRequestPhotoLibraryPermission = jest.fn();
const mockGetRecentPhotoAssets = jest.fn();
const mockGetAlbums = jest.fn();
const mockGetAlbumPhotoAssets = jest.fn();

jest.mock('@adapters/expo/media-library', () => ({
  requestPhotoLibraryPermission: (...args: unknown[]) => mockRequestPhotoLibraryPermission(...args),
  getRecentPhotoAssets: (...args: unknown[]) => mockGetRecentPhotoAssets(...args),
  getAlbums: (...args: unknown[]) => mockGetAlbums(...args),
  getAlbumPhotoAssets: (...args: unknown[]) => mockGetAlbumPhotoAssets(...args),
}));

jest.mock('@ui/layout', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    BottomSheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
      visible ? <View>{children}</View> : null,
  };
});

const { BatchPhotoPicker } = require('@features/batch/batch-photo-picker');

describe('BatchPhotoPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestPhotoLibraryPermission.mockResolvedValue({ granted: true, status: 'granted' });
  });

  it('preserves selected assets across recent and album tabs when confirming', async () => {
    const recentAssets = [
      { id: 'recent-1', uri: 'file:///recent-1.jpg', width: 100, height: 100 },
      { id: 'recent-2', uri: 'file:///recent-2.jpg', width: 100, height: 100 },
    ];
    const album = { id: 'album-1', title: 'Favorites', assetCount: 1 };
    const albumAssets = [{ id: 'album-asset-1', uri: 'file:///album-1.jpg', width: 100, height: 100 }];

    mockGetRecentPhotoAssets.mockResolvedValue(recentAssets);
    mockGetAlbums.mockResolvedValue([album]);
    mockGetAlbumPhotoAssets.mockResolvedValue(albumAssets);

    const onSelect = jest.fn();
    const onClose = jest.fn();
    const screen = render(
      <BatchPhotoPicker visible currentCount={0} onSelect={onSelect} onClose={onClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Recent')).toBeTruthy();
    });

    fireEvent.press(screen.getAllByLabelText('Photo, not selected')[0]);
    fireEvent.press(screen.getByLabelText('Albums tab'));

    await waitFor(() => {
      expect(screen.getByLabelText('Album Favorites')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Album Favorites'));

    await waitFor(() => {
      expect(screen.getAllByLabelText('Photo, not selected').length).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getAllByLabelText('Photo, not selected')[0]);
    fireEvent.press(screen.getByLabelText('Confirm selection'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'recent-1' }),
        expect.objectContaining({ id: 'album-asset-1' }),
      ]),
    );
    expect(onSelect.mock.calls[0]?.[0]).toHaveLength(2);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('resets local selection and album state after the picker closes without confirming', async () => {
    const recentAssets = [
      { id: 'recent-1', uri: 'file:///recent-1.jpg', width: 100, height: 100 },
    ];
    const album = { id: 'album-1', title: 'Favorites', assetCount: 1 };

    mockGetRecentPhotoAssets.mockResolvedValue(recentAssets);
    mockGetAlbums.mockResolvedValue([album]);
    mockGetAlbumPhotoAssets.mockResolvedValue([]);

    const onSelect = jest.fn();
    const onClose = jest.fn();
    const screen = render(
      <BatchPhotoPicker visible currentCount={0} onSelect={onSelect} onClose={onClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Select Photos (0/20)')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Photo, not selected'));
    fireEvent.press(screen.getByLabelText('Albums tab'));

    await waitFor(() => {
      expect(screen.getByLabelText('Album Favorites')).toBeTruthy();
      expect(screen.getByText('Select Photos (1/20)')).toBeTruthy();
    });

    screen.rerender(
      <BatchPhotoPicker visible={false} currentCount={0} onSelect={onSelect} onClose={onClose} />,
    );
    screen.rerender(
      <BatchPhotoPicker visible currentCount={0} onSelect={onSelect} onClose={onClose} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Select Photos (0/20)')).toBeTruthy();
      expect(screen.queryByLabelText('Album Favorites')).toBeNull();
    });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
