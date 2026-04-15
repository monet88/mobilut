import { cubeToHald } from '@lut-core/hald';
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

describe('cubeToHald', () => {
  it('converts an identity LUT into identity hald rows', () => {
    const result = cubeToHald(makeIdentityLut(2));

    expect(result.width).toBe(8);
    expect(result.height).toBe(8);
    expect(Array.from(result.pixels.slice(0, 4))).toEqual([0, 0, 0, 255]);

    const lastRowOffset = 7 * result.width * 4;
    expect(Array.from(result.pixels.slice(lastRowOffset, lastRowOffset + 4))).toEqual([
      255, 255, 255, 255,
    ]);
  });

  it('returns the expected output dimensions', () => {
    const result = cubeToHald(makeIdentityLut(8));

    expect(result.width).toBe(512);
    expect(result.height).toBe(512);
    expect(result.pixels).toHaveLength(512 * 512 * 4);
  });
});
