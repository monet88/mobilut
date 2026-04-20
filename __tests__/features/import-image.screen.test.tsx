import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { ImportImageScreen } from '@features/import-image/import-image.screen';
import { useImportImage } from '@features/import-image/use-import-image';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

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

    const { getByText, queryByText } = render(<ImportImageScreen />);

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

    const { getByText } = render(<ImportImageScreen />);

    fireEvent.press(getByText('Choose from Library'));

    expect(pickImage).toHaveBeenCalledTimes(1);
  });
});
