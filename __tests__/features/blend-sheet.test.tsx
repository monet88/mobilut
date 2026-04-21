import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

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

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  MediaTypeOptions: { Images: 'Images' },
}));

const { BlendSheet } = require('@features/editor/blend-sheet');

describe('BlendSheet', () => {
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
});
