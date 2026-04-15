import { validateHald } from '@lut-core/hald';

describe('validateHald', () => {
  it('passes for a valid 512x512 hald image', () => {
    const width = 512;
    const pixels = new Uint8Array(width * width * 4);
    const result = validateHald(pixels, width, width);

    expect(result.ok).toBe(true);
  });

  it('fails for non-square dimensions', () => {
    const pixels = new Uint8Array(8 * 4 * 4);
    const result = validateHald(pixels, 8, 4);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('HALD_NON_SQUARE');
    }
  });

  it('fails for dimensions that are not perfect cubes', () => {
    const pixels = new Uint8Array(10 * 10 * 4);
    const result = validateHald(pixels, 10, 10);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('HALD_INVALID_DIMENSION');
    }
  });
});
