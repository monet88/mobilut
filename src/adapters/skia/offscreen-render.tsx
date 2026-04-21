import React from 'react';
import {
  ColorMatrix,
  Group,
  Image,
  Paint,
  Skia,
  drawAsImage,
  ImageFormat as SkiaImageFormat,
} from '@shopify/react-native-skia';

const IDENTITY_COLOR_MATRIX = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
] as const;

interface ColorMatrixRenderOptions {
  readonly sourceBase64: string;
  readonly width: number;
  readonly height: number;
  readonly colorMatrix: readonly number[];
  readonly intensity: number;
  readonly format: 'jpeg' | 'png';
  readonly quality: number;
}

function toSkiaImageFormat(format: 'jpeg' | 'png'): SkiaImageFormat {
  return format === 'png' ? SkiaImageFormat.PNG : SkiaImageFormat.JPEG;
}

function mixColorMatrix(matrix: readonly number[], intensity: number): number[] {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  return IDENTITY_COLOR_MATRIX.map((identityValue, index) => {
    const targetValue = matrix[index] ?? identityValue;
    return identityValue + (targetValue - identityValue) * clampedIntensity;
  });
}

export function renderBase64ImageWithColorMatrix({
  sourceBase64,
  width,
  height,
  colorMatrix,
  intensity,
  format,
  quality,
}: ColorMatrixRenderOptions): string {
  const data = Skia.Data.fromBase64(sourceBase64);
  const image = Skia.Image.MakeImageFromEncoded(data);

  if (!image) {
    throw new Error('Failed to decode image for Skia offscreen rendering');
  }

  const renderedImage = drawAsImage(
    <Group
      layer={
        <Paint>
          <ColorMatrix matrix={mixColorMatrix(colorMatrix, intensity)} />
        </Paint>
      }
    >
      <Image image={image} x={0} y={0} width={width} height={height} fit="fill" />
    </Group>,
    { width, height },
  );

  return renderedImage.encodeToBase64(toSkiaImageFormat(format), Math.round(quality * 100));
}
