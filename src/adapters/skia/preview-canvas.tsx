import React from 'react';
import { Canvas, Group, Image, useImage } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

import type { BlendLayer } from '@core/blend';

import { getSkiaBlendMode } from './blend-shader';

interface PreviewCanvasProps {
  readonly imageUri: string;
  readonly width: number;
  readonly height: number;
  readonly blendLayers?: readonly BlendLayer[] | null;
}

interface BlendPreviewLayerProps {
  readonly layer: BlendLayer;
  readonly width: number;
  readonly height: number;
}

function BlendPreviewLayer({
  layer,
  width,
  height,
}: BlendPreviewLayerProps): React.JSX.Element | null {
  const image = useImage(layer.imageUri);

  if (!image) {
    return null;
  }

  return (
    <Group blendMode={getSkiaBlendMode(layer.blendMode)} opacity={layer.opacity}>
      <Image
        image={image}
        x={layer.position.x}
        y={layer.position.y}
        width={width * layer.scale}
        height={height * layer.scale}
        fit="contain"
      />
    </Group>
  );
}

export function PreviewCanvas({
  imageUri,
  width,
  height,
  blendLayers = null,
}: PreviewCanvasProps): React.JSX.Element {
  const image = useImage(imageUri);

  return (
    <View style={[styles.container, { width, height }]}>
      <Canvas style={{ width, height }}>
        {image ? (
          <>
            <Image image={image} x={0} y={0} width={width} height={height} fit="contain" />
            {blendLayers?.map((layer) => (
              <BlendPreviewLayer key={layer.id} layer={layer} width={width} height={height} />
            ))}
          </>
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
