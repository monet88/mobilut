import React from 'react';
import { Canvas, Image, useImage } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

interface PreviewCanvasProps {
  readonly imageUri: string;
  readonly width: number;
  readonly height: number;
}

export function PreviewCanvas({ imageUri, width, height }: PreviewCanvasProps): React.JSX.Element {
  const image = useImage(imageUri);

  return (
    <View style={[styles.container, { width, height }]}>
      <Canvas style={{ width, height }}>
        {image ? (
          <Image image={image} x={0} y={0} width={width} height={height} fit="contain" />
        ) : null}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
