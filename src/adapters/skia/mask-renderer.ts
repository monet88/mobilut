import type { RegionMask } from '@core/edit-session';

export interface MaskGeometry {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly type: 'rect' | 'ellipse';
  readonly feather: number;
}

export function regionMaskToGeometry(
  mask: RegionMask,
  canvasWidth: number,
  canvasHeight: number,
): MaskGeometry {
  return {
    x: mask.x * canvasWidth,
    y: mask.y * canvasHeight,
    width: mask.width * canvasWidth,
    height: mask.height * canvasHeight,
    type: mask.type,
    feather: mask.feather,
  };
}
