import React from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  View,
} from 'react-native';

import { useTheme } from '@theme/use-theme';

import { Text } from './text';

export interface SliderProps {
  readonly value: number;
  readonly minimumValue?: number;
  readonly maximumValue?: number;
  readonly step?: number;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly onValueChange?: (value: number) => void;
  readonly onSlidingComplete?: (value: number) => void;
}

function clamp(value: number, minimumValue: number, maximumValue: number): number {
  return Math.min(Math.max(value, minimumValue), maximumValue);
}

function roundToStep(value: number, step: number): number {
  if (step <= 0) {
    return value;
  }

  return Math.round(value / step) * step;
}

export function Slider({
  value,
  minimumValue = 0,
  maximumValue = 1,
  step = 0,
  disabled = false,
  label,
  onValueChange,
  onSlidingComplete,
}: SliderProps): React.JSX.Element {
  const theme = useTheme();
  const [trackWidth, setTrackWidth] = React.useState(0);

  const updateValueFromPosition = React.useCallback(
    (positionX: number) => {
      if (trackWidth <= 0 || disabled) {
        return value;
      }

      const ratio = clamp(positionX / trackWidth, 0, 1);
      const rawValue = minimumValue + ratio * (maximumValue - minimumValue);
      const steppedValue = clamp(roundToStep(rawValue, step), minimumValue, maximumValue);
      onValueChange?.(steppedValue);
      return steppedValue;
    },
    [disabled, maximumValue, minimumValue, onValueChange, step, trackWidth, value],
  );

  const handleTrackPress = React.useCallback(
    (event: GestureResponderEvent) => {
      const nextValue = updateValueFromPosition(event.nativeEvent.locationX);
      onSlidingComplete?.(nextValue);
    },
    [onSlidingComplete, updateValueFromPosition],
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (event) => {
          updateValueFromPosition(event.nativeEvent.locationX);
        },
        onPanResponderMove: (event) => {
          updateValueFromPosition(event.nativeEvent.locationX);
        },
        onPanResponderRelease: (event) => {
          const nextValue = updateValueFromPosition(event.nativeEvent.locationX);
          onSlidingComplete?.(nextValue);
        },
      }),
    [disabled, onSlidingComplete, updateValueFromPosition],
  );

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  const normalizedValue = clamp(value, minimumValue, maximumValue);
  const ratio =
    maximumValue === minimumValue
      ? 0
      : (normalizedValue - minimumValue) / (maximumValue - minimumValue);
  const progressWidth = trackWidth * ratio;

  return (
    <View style={{ gap: theme.spacing.sm, opacity: disabled ? 0.5 : 1 }}>
      {label ? (
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}
        >
          <Text variant="label">{label}</Text>
          <Text variant="caption">{normalizedValue.toFixed(2)}</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="adjustable"
        accessibilityValue={{
          min: minimumValue,
          max: maximumValue,
          now: normalizedValue,
          text: normalizedValue.toFixed(2),
        }}
        disabled={disabled}
        onLayout={handleLayout}
        onPress={handleTrackPress}
        style={{ justifyContent: 'center', minHeight: 32 }}
      >
        <View
          style={{
            height: 6,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.surfaceElevated,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: progressWidth,
              height: '100%',
              backgroundColor: theme.colors.accent,
            }}
          />
        </View>
        <View
          style={{
            position: 'absolute',
            left: Math.max(progressWidth - 12, 0),
            width: 24,
            height: 24,
            borderRadius: theme.radius.full,
            borderCurve: 'continuous',
            backgroundColor: theme.colors.primary,
            borderWidth: 2,
            borderColor: theme.colors.background,
          }}
          {...panResponder.panHandlers}
        />
      </Pressable>
    </View>
  );
}
