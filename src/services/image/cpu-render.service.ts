import { applyLut } from '@lut-core/interpolate/trilinear';
import type { LutTable } from '@lut-core/model/lut-table';

export async function applyCpuLut(
  pixelData: Uint8ClampedArray,
  width: number,
  height: number,
  lut: LutTable,
  intensity: number,
): Promise<Uint8ClampedArray> {
  const result = new Uint8ClampedArray(pixelData.length);
  const clampedIntensity = Math.min(1, Math.max(0, intensity));

  for (let i = 0; i < pixelData.length; i += 4) {
    const r = pixelData[i] / 255;
    const g = pixelData[i + 1] / 255;
    const b = pixelData[i + 2] / 255;
    const a = pixelData[i + 3];
    const [outR, outG, outB] = applyLut(r, g, b, lut);

    result[i] = Math.round((outR * clampedIntensity + r * (1 - clampedIntensity)) * 255);
    result[i + 1] = Math.round((outG * clampedIntensity + g * (1 - clampedIntensity)) * 255);
    result[i + 2] = Math.round((outB * clampedIntensity + b * (1 - clampedIntensity)) * 255);
    result[i + 3] = a;
  }

  void width;
  void height;

  return result;
}
