import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@ui/layout', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    BottomSheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
      visible ? <View>{children}</View> : null,
  };
});

jest.mock('@ui/primitives', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return {
    Text,
    Button: ({ label, onPress }: { label: string; onPress?: () => void }) => (
      <Pressable accessibilityLabel={label} onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    ),
    Slider: ({ onValueChange, onSlidingComplete }: { onValueChange?: (value: number) => void; onSlidingComplete?: (value: number) => void }) => (
      <>
        <Pressable accessibilityLabel="change opacity" onPress={() => onValueChange?.(0.25)}>
          <Text>change opacity</Text>
        </Pressable>
        <Pressable accessibilityLabel="complete opacity" onPress={() => onSlidingComplete?.(0.25)}>
          <Text>complete opacity</Text>
        </Pressable>
      </>
    ),
  };
});

jest.mock('@ui/feedback', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    ErrorBanner: ({ message }: { message: string }) => <Text>{message}</Text>,
  };
});

const mockPickImageFromLibrary = jest.fn();

jest.mock('@adapters/expo/image-picker', () => ({
  pickImageFromLibrary: (...args: unknown[]) => mockPickImageFromLibrary(...args),
}));

const { BlendSheet } = require('@features/editor/blend-sheet');

describe('BlendSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPickImageFromLibrary.mockResolvedValue(null);
  });

  it('defers preview updates for opacity changes until sliding is complete', () => {
    const onPreview = jest.fn();
    const screen = render(
      <BlendSheet
        visible
        initialParams={{
          layers: [
            {
              id: 'layer-1',
              imageUri: 'file:///layer.jpg',
              width: 100,
              height: 100,
              blendMode: 'normal',
              opacity: 1,
              position: { x: 0, y: 0 },
              scale: 1,
            },
          ],
        }}
        onApply={jest.fn()}
        onCancel={jest.fn()}
        onPreview={onPreview}
      />,
    );

    fireEvent.press(screen.getByLabelText('Select layer'));
    fireEvent.press(screen.getByLabelText('change opacity'));

    expect(onPreview).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('complete opacity'));

    expect(onPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        layers: [expect.objectContaining({ opacity: 0.25 })],
      }),
    );
  });

  it('shows a recoverable error when adding a blend layer fails', async () => {
    mockPickImageFromLibrary.mockRejectedValue(new Error('Photo library access is required'));
    const onPreview = jest.fn();
    const screen = render(
      <BlendSheet
        visible
        initialParams={null}
        onApply={jest.fn()}
        onCancel={jest.fn()}
        onPreview={onPreview}
      />,
    );

    fireEvent.press(screen.getByLabelText('Add blend layer'));

    await waitFor(() => {
      expect(screen.getByText('Photo library access is required')).toBeTruthy();
    });
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('reinitializes layer state from initial params when reopened', async () => {
    const onPreview = jest.fn();
    const initialParams = {
      layers: [
        {
          id: 'layer-1',
          imageUri: 'file:///layer.jpg',
          width: 100,
          height: 100,
          blendMode: 'normal' as const,
          opacity: 1,
          position: { x: 0, y: 0 },
          scale: 1,
        },
      ],
    };
    const screen = render(
      <BlendSheet
        visible
        initialParams={initialParams}
        onApply={jest.fn()}
        onCancel={jest.fn()}
        onPreview={onPreview}
      />,
    );

    expect(screen.getAllByLabelText('Select layer')).toHaveLength(1);

    fireEvent.press(screen.getByLabelText('Clear all layers'));

    expect(screen.queryAllByLabelText('Select layer')).toHaveLength(0);

    screen.rerender(
      <BlendSheet
        visible={false}
        initialParams={initialParams}
        onApply={jest.fn()}
        onCancel={jest.fn()}
        onPreview={onPreview}
      />,
    );
    screen.rerender(
      <BlendSheet
        visible
        initialParams={initialParams}
        onApply={jest.fn()}
        onCancel={jest.fn()}
        onPreview={onPreview}
      />,
    );

    await waitFor(() => {
      expect(screen.getAllByLabelText('Select layer')).toHaveLength(1);
    });
  });
});
