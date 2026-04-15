/**
 * A 3D LUT represented as a flat Float32Array.
 * Layout: [r0g0b0_R, r0g0b0_G, r0g0b0_B, r0g0b1_R, ...]
 * Index formula: (b * size * size + g * size + r) * 3
 */
export interface LutTable {
  readonly size: number;
  readonly data: Float32Array;
}

export function createLutTable(size: number): LutTable {
  return {
    size,
    data: new Float32Array(size * size * size * 3),
  };
}

export function lutTableIndex(r: number, g: number, b: number, size: number): number {
  return (b * size * size + g * size + r) * 3;
}
