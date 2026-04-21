import { Skia } from '@shopify/react-native-skia';

import type { ProClarityParams } from '@core/stylistic/pro-clarity-model';

export function createClarityShaderSource(): string {
  return `
uniform shader image;
uniform float clarity;
uniform float sharpness;
uniform float structure;
uniform float microContrast;
uniform float2 resolution;

half4 main(float2 coord) {
  half4 color = image.eval(coord);
  float2 texel = 1.0 / resolution;

  half4 left = image.eval(coord - float2(texel.x, 0));
  half4 right = image.eval(coord + float2(texel.x, 0));
  half4 top = image.eval(coord - float2(0, texel.y));
  half4 bottom = image.eval(coord + float2(0, texel.y));

  half4 laplacian = 4.0 * color - left - right - top - bottom;
  color.rgb += laplacian.rgb * sharpness * 0.5;

  half4 avg = (left + right + top + bottom) * 0.25;
  half4 diff = color - avg;
  color.rgb += diff.rgb * clarity * 0.3;

  float edge = length(laplacian.rgb);
  color.rgb += diff.rgb * structure * edge * 0.2;

  float luma = dot(color.rgb, half3(0.299, 0.587, 0.114));
  float localLuma = dot(avg.rgb, half3(0.299, 0.587, 0.114));
  color.rgb += (luma - localLuma) * microContrast * 0.4;

  return saturate(color);
}
`;
}

export function compileClarityEffect(): ReturnType<typeof Skia.RuntimeEffect.Make> {
  return Skia.RuntimeEffect.Make(createClarityShaderSource());
}

export function buildClarityUniforms(
  params: ProClarityParams,
  width: number,
  height: number,
): Record<string, number | number[]> {
  return {
    clarity: params.clarity,
    sharpness: params.sharpness,
    structure: params.structure,
    microContrast: params.microContrast,
    resolution: [width, height],
  };
}
