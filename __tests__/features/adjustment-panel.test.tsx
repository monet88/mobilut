import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { AdjustmentPanel } from '@features/editor/components/adjustment-panel';

jest.mock('@ui/primitives', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    Text,
    Slider: ({
      label,
      value,
      onValueChange,
      onSlidingComplete,
    }: {
      label: string;
      value: number;
      onValueChange?: (value: number) => void;
      onSlidingComplete?: (value: number) => void;
    }) => (
      <View>
        <Text>{label}</Text>
        <Pressable onPress={() => onValueChange?.(value + 1)}>
          <Text>{`${label} change`}</Text>
        </Pressable>
        <Pressable onPress={() => onSlidingComplete?.(value)}>
          <Text>{`${label} commit`}</Text>
        </Pressable>
      </View>
    ),
  };
});

describe('AdjustmentPanel', () => {
  it('commits adjustments on slider release instead of every intermediate drag tick', () => {
    const onChangeAdjustments = jest.fn();

    const screen = render(
      <AdjustmentPanel
        adjustments={{
          intensity: 1,
          temperature: 0,
          brightness: 0,
          contrast: 0,
          saturation: 0,
          sharpen: 0,
        }}
        onChangeAdjustments={onChangeAdjustments}
      />,
    );

    fireEvent.press(screen.getByText('Intensity change'));
    expect(onChangeAdjustments).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Intensity commit'));
    expect(onChangeAdjustments).toHaveBeenCalledTimes(1);
    expect(onChangeAdjustments).toHaveBeenCalledWith({ intensity: 2 });
  });
});
