import React, { useMemo, useState } from 'react';
import { Image, PanResponder, StyleSheet, View } from 'react-native';

interface BeforeAfterProps {
  readonly beforeUri: string;
  readonly afterUri: string;
  readonly width: number;
  readonly height: number;
}

export function BeforeAfter({
  beforeUri,
  afterUri,
  width,
  height,
}: BeforeAfterProps): React.JSX.Element {
  const [dividerX, setDividerX] = useState(width / 2);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          setDividerX(clampDivider(event.nativeEvent.locationX, width));
        },
        onPanResponderMove: (event) => {
          setDividerX(clampDivider(event.nativeEvent.locationX, width));
        },
      }),
    [width],
  );

  return (
    <View style={[styles.container, { width, height }]} {...panResponder.panHandlers}>
      <Image
        source={{ uri: beforeUri }}
        style={[styles.image, { width, height }]}
        resizeMode="cover"
      />
      <View style={[styles.afterContainer, { width: dividerX, height }]}>
        <Image
          source={{ uri: afterUri }}
          style={[styles.image, { width, height }]}
          resizeMode="cover"
        />
      </View>
      <View style={[styles.divider, { left: dividerX - 1 }]} />
    </View>
  );
}

function clampDivider(value: number, width: number): number {
  return Math.max(0, Math.min(width, value));
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  afterContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  divider: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
  },
});
