import { applyLut } from '@lut-core/interpolate';
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

function makeLinearLut(size: number): LutTable {
  const data = new Float32Array(size * size * size * 3);

  for (let blue = 0; blue < size; blue += 1) {
    for (let green = 0; green < size; green += 1) {
      for (let red = 0; red < size; red += 1) {
        const offset = lutTableIndex(red, green, blue, size);
        const redValue = red / (size - 1);
        const greenValue = green / (size - 1);
        const blueValue = blue / (size - 1);
        data[offset] = 0.2 * redValue + 0.1 * greenValue + 0.3 * blueValue;
        data[offset + 1] = 0.4 * redValue + 0.5 * greenValue;
        data[offset + 2] = 0.25 * blueValue;
      }
    }
  }

  return { size, data };
}

describe('applyLut', () => {
  it('returns identity values for an identity LUT', () => {
    const output = applyLut(0.25, 0.5, 0.75, makeIdentityLut(4));

    expect(output[0]).toBeCloseTo(0.25, 6);
    expect(output[1]).toBeCloseTo(0.5, 6);
    expect(output[2]).toBeCloseTo(0.75, 6);
  });

  it('interpolates known LUT values correctly', () => {
    const output = applyLut(0.25, 0.5, 0.75, makeLinearLut(2));

    expect(output[0]).toBeCloseTo(0.325, 6);
    expect(output[1]).toBeCloseTo(0.35, 6);
    expect(output[2]).toBeCloseTo(0.1875, 6);
  });

  it('handles edge values at 0 and 1 exactly', () => {
    const lut = makeIdentityLut(8);

    expect(applyLut(0, 0, 0, lut)).toEqual([0, 0, 0]);
    expect(applyLut(1, 1, 1, lut)).toEqual([1, 1, 1]);
  });
});
