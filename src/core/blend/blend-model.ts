export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'darken'
  | 'lighten'
  | 'difference'
  | 'exclusion';

export interface BlendLayer {
  readonly id: string;
  readonly imageUri: string;
  readonly width: number;
  readonly height: number;
  readonly blendMode: BlendMode;
  readonly opacity: number;
  readonly position: { x: number; y: number };
  readonly scale: number;
}

export interface BlendParams {
  readonly layers: readonly BlendLayer[];
}

export const BLEND_MODE_LABELS: Record<BlendMode, string> = {
  normal: 'Normal',
  multiply: 'Multiply',
  screen: 'Screen',
  overlay: 'Overlay',
  'soft-light': 'Soft Light',
  'hard-light': 'Hard Light',
  'color-dodge': 'Color Dodge',
  'color-burn': 'Color Burn',
  darken: 'Darken',
  lighten: 'Lighten',
  difference: 'Difference',
  exclusion: 'Exclusion',
};

export function createBlendLayer(
  imageUri: string,
  width: number,
  height: number,
): BlendLayer {
  return {
    id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    imageUri,
    width,
    height,
    blendMode: 'normal',
    opacity: 1,
    position: { x: 0, y: 0 },
    scale: 1,
  };
}
