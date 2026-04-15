import { parseHald } from '@lut-core/hald';

function makeIdentityHaldPixels(size: number): {
  pixels: Uint8Array;
  width: number;
  height: number;
} {
  const width = size ** 3;
  const height = width;
  const pixels = new Uint8Array(width * height * 4);

  for (let entryIndex = 0; entryIndex < width; entryIndex += 1) {
    const red = entryIndex % size;
    const green = Math.floor(entryIndex / size) % size;
    const blue = Math.floor(entryIndex / (size * size)) % size;
    const redValue = Math.round((red / (size - 1)) * 255);
    const greenValue = Math.round((green / (size - 1)) * 255);
    const blueValue = Math.round((blue / (size - 1)) * 255);

    for (let x = 0; x < width; x += 1) {
      const offset = (entryIndex * width + x) * 4;
      pixels[offset] = redValue;
      pixels[offset + 1] = greenValue;
      pixels[offset + 2] = blueValue;
      pixels[offset + 3] = 255;
    }
  }

  return { pixels, width, height };
}

describe('parseHald', () => {
  it('parses a valid 512x512 Hald image into a size 8 LUT', () => {
    const { pixels, width, height } = makeIdentityHaldPixels(8);
    const result = parseHald(pixels, width, height);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.size).toBe(8);
    const firstTwoEntries = Array.from(result.value.data.slice(0, 6));

    expect(firstTwoEntries[0]).toBeCloseTo(0, 6);
    expect(firstTwoEntries[1]).toBeCloseTo(0, 6);
    expect(firstTwoEntries[2]).toBeCloseTo(0, 6);
    expect(firstTwoEntries[3]).toBeCloseTo(36 / 255, 6);
    expect(firstTwoEntries[4]).toBeCloseTo(0, 6);
    expect(firstTwoEntries[5]).toBeCloseTo(0, 6);
  });

  it('returns an error for non-square dimensions', () => {
    const { pixels } = makeIdentityHaldPixels(2);
    const result = parseHald(pixels, 8, 4);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('HALD_NON_SQUARE');
    }
  });

  it('returns an error when the dimensions are not a perfect cube', () => {
    const pixels = new Uint8Array(10 * 10 * 4);
    const result = parseHald(pixels, 10, 10);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('HALD_INVALID_DIMENSION');
    }
  });
});
