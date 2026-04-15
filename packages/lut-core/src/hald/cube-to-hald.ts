import { LutTable } from '../model';

function clampChannel(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return Math.round(clamped * 255);
}

export interface HaldImageBuffer {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8Array;
}

export function cubeToHald(lut: LutTable): HaldImageBuffer {
  const width = lut.size ** 3;
  const height = width;
  const pixels = new Uint8Array(width * height * 4);
  const entryCount = lut.size ** 3;

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    const tableOffset = entryIndex * 3;
    const red = clampChannel(lut.data[tableOffset]);
    const green = clampChannel(lut.data[tableOffset + 1]);
    const blue = clampChannel(lut.data[tableOffset + 2]);

    for (let x = 0; x < width; x += 1) {
      const pixelOffset = (entryIndex * width + x) * 4;
      pixels[pixelOffset] = red;
      pixels[pixelOffset + 1] = green;
      pixels[pixelOffset + 2] = blue;
      pixels[pixelOffset + 3] = 255;
    }
  }

  return { width, height, pixels };
}
