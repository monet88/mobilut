import React from 'react';
import { render } from '@testing-library/react-native';

import { LoadingOverlay } from '@ui/feedback/loading-overlay';

jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  const mockReactNative = Object.create(actual);

  Object.defineProperty(mockReactNative, 'Modal', {
    value: ({ children }: { children: React.ReactNode }) => (
      <actual.View testID="native-modal">{children}</actual.View>
    ),
  });

  return mockReactNative;
});

describe('LoadingOverlay', () => {
  it('does not mount a native modal while hidden', () => {
    const screen = render(<LoadingOverlay visible={false} />);

    expect(screen.queryByTestId('native-modal')).toBeNull();
  });

  it('renders the provided message while visible', () => {
    const screen = render(<LoadingOverlay visible message="Loading drafts…" />);

    expect(screen.getByTestId('native-modal')).toBeTruthy();
    expect(screen.getByText('Loading drafts…')).toBeTruthy();
  });
});
