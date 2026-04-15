import { sampleToStrip } from '@lut-core/interpolate';
import { LutTable, lutTableIndex } from '@lut-core/model';

function makeIdentityLut(size: number): LutTable {
  const data = new Float32Array(size * size * size * 3);

  for (let blue = 0; blue < size; blue += 1) {
    for (let green = 0; green < size; green += 1) {
      for (let red = 0; red < size; red += 1) {
        const offset = lutTableIndex(red, green, blue, size);
        data[offset] = red / (size - 1);
        data[offset + 1] = green / (size - 1);
        data[offset + 2] = blue / (size - 1);
      }
    }
  }

  return { size, data };
}

describe('sampleToStrip', () => {
  it('produces identity samples for an identity LUT', () => {
    const strip = sampleToStrip(makeIdentityLut(8), 5);

    expect(Array.from(strip)).toEqual([
      0, 0, 0, 0.25, 0.25, 0.25, 0.5, 0.5, 0.5, 0.75, 0.75, 0.75, 1, 1, 1,
    ]);
  });

  it('returns width * 3 values', () => {
    const strip = sampleToStrip(makeIdentityLut(4), 512);

    expect(strip).toHaveLength(512 * 3);
  });

  it('keeps values in the 0..1 range', () => {
    const strip = sampleToStrip(makeIdentityLut(4), 32);

    for (const value of strip) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
