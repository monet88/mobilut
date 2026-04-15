import { LutTable } from '../model';
import { applyLut } from './trilinear';

export function sampleToStrip(lut: LutTable, stripWidth: number): Float32Array {
  const strip = new Float32Array(stripWidth * 3);

  if (stripWidth <= 0) {
    return strip;
  }

  for (let sampleIndex = 0; sampleIndex < stripWidth; sampleIndex += 1) {
    const position = stripWidth === 1 ? 0 : sampleIndex / (stripWidth - 1);
    const [red, green, blue] = applyLut(position, position, position, lut);
    const offset = sampleIndex * 3;
    strip[offset] = red;
    strip[offset + 1] = green;
    strip[offset + 2] = blue;
  }

  return strip;
}
