import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { ImportImageScreen } from '@features/import-image/import-image.screen';
import { useImportImage } from '@features/import-image/use-import-image';

jest.mock('@ui/feedback', () => ({
  ErrorBanner: ({ message }: { message: string }) => message,
  LoadingOverlay: ({ message }: { message?: string }) => message ?? 'Loading…',
}));

jest.mock('@features/import-image/use-import-image', () => ({
  useImportImage: jest.fn(),
}));

const mockedUseImportImage = jest.mocked(useImportImage);

describe('ImportImageScreen', () => {
  it('does not render the loading overlay while the library picker is active', () => {
    mockedUseImportImage.mockReturnValue({
      isLoading: true,
      error: null,
      pickImage: jest.fn(),
    });

    const { getByText, queryByText } = render(<ImportImageScreen onImageSelected={jest.fn()} />);

    expect(getByText('Choose from Library')).toBeTruthy();
    expect(queryByText('Importing photo…')).toBeNull();
  });

  it('starts image picking when the user presses the import button', () => {
    const pickImage = jest.fn().mockResolvedValue(null);
    mockedUseImportImage.mockReturnValue({
      isLoading: false,
      error: null,
      pickImage,
    });

    const { getByText } = render(<ImportImageScreen onImageSelected={jest.fn()} />);

    fireEvent.press(getByText('Choose from Library'));

    expect(pickImage).toHaveBeenCalledTimes(1);
  });

  it('delegates successful image selection to the route layer', async () => {
    const pickImage = jest.fn().mockResolvedValue({
      id: 'asset-1',
      uri: 'file:///photo.jpg',
      width: 1200,
      height: 900,
      format: 'jpeg',
      fileSize: null,
    });
    const onImageSelected = jest.fn();

    mockedUseImportImage.mockReturnValue({
      isLoading: false,
      error: null,
      pickImage,
    });

    const { getByText } = render(<ImportImageScreen onImageSelected={onImageSelected} />);

    fireEvent.press(getByText('Choose from Library'));

    await waitFor(() => {
      expect(onImageSelected).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'asset-1', uri: 'file:///photo.jpg' }),
      );
    });
  });
});
