import type { BlendMode } from '@core/blend';

// Skia blend mode string values (from @shopify/react-native-skia)
export type SkiaBlendMode =
  | 'srcOver'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'softLight'
  | 'hardLight'
  | 'colorDodge'
  | 'colorBurn'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'exclusion';

export const SKIA_BLEND_MODES: Record<BlendMode, SkiaBlendMode> = {
  normal: 'srcOver',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  'soft-light': 'softLight',
  'hard-light': 'hardLight',
  'color-dodge': 'colorDodge',
  'color-burn': 'colorBurn',
  darken: 'darken',
  lighten: 'lighten',
  difference: 'difference',
  exclusion: 'exclusion',
};

export function getSkiaBlendMode(mode: BlendMode): SkiaBlendMode {
  return SKIA_BLEND_MODES[mode] ?? 'srcOver';
}
