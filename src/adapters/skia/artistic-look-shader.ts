import { Skia } from '@shopify/react-native-skia';

import type { ArtisticLookStyle } from '@core/stylistic/artistic-look-model';

export const ARTISTIC_LOOK_SHADER_SOURCE = `
uniform shader image;
uniform half4x4 colorMatrix;
uniform half4 colorOffset;
uniform float intensity;
uniform float vignette;
uniform float grain;
uniform float contrast;
uniform float2 resolution;

half4 main(float2 coord) {
  half4 color = image.eval(coord);

  // Apply color matrix with intensity blend
  half4 transformed = colorMatrix * color + colorOffset;
  color = mix(color, transformed, intensity);

  // Contrast adjustment
  color.rgb = (color.rgb - 0.5) * (1.0 + contrast * intensity) + 0.5;

  // Vignette (aspect-ratio corrected)
  float2 uv = coord / resolution;
  float2 center = uv - 0.5;
  center.x *= resolution.x / resolution.y;
  float dist = length(center);
  float vig = 1.0 - smoothstep(0.3, 0.8, dist) * vignette * intensity;
  color.rgb *= vig;

  // Film grain (pseudo-random, coord-based)
  float n = fract(sin(dot(coord, float2(12.9898, 78.233))) * 43758.5453);
  color.rgb += (n - 0.5) * grain * intensity;

  return saturate(color);
}
`;

export function compileArtisticLookEffect(): ReturnType<typeof Skia.RuntimeEffect.Make> {
  return Skia.RuntimeEffect.Make(ARTISTIC_LOOK_SHADER_SOURCE);
}

export function buildArtisticLookUniforms(
  style: ArtisticLookStyle,
  intensity: number,
  width: number,
  height: number,
): Record<string, number | number[]> {
  const m = style.colorMatrix;
  return {
    // Column-major 4x4: each column is [R_coeff, G_coeff, B_coeff, A_coeff]
    // from the 4x5 color matrix rows
    colorMatrix: [
      m[0],  m[5],  m[10], m[15],  // column 0: how much input R contributes
      m[1],  m[6],  m[11], m[16],  // column 1: how much input G contributes
      m[2],  m[7],  m[12], m[17],  // column 2: how much input B contributes
      m[3],  m[8],  m[13], m[18],  // column 3: how much input A contributes
    ],
    colorOffset: [m[4], m[9], m[14], m[19]],
    intensity,
    vignette: style.vignetteStrength,
    grain: style.grainAmount,
    contrast: style.contrastBoost,
    resolution: [width, height],
  };
}
