import { ParseResult, err, ok } from '../model';

function isPerfectCube(value: number): boolean {
  const cubeRoot = Math.round(Math.cbrt(value));
  return cubeRoot ** 3 === value;
}

export function validateHald(pixels: Uint8Array, width: number, height: number): ParseResult<void> {
  if (width !== height) {
    return err('HALD_NON_SQUARE', 'Hald image dimensions must be square.', {
      width,
      height,
    });
  }

  if (!isPerfectCube(width)) {
    return err('HALD_INVALID_DIMENSION', 'Hald image width must be a perfect cube.', {
      width,
      height,
    });
  }

  const expectedLength = width * height * 4;
  if (pixels.length !== expectedLength) {
    return err(
      'HALD_INVALID_PIXEL_COUNT',
      'Hald image pixel buffer length does not match dimensions.',
      {
        expectedLength,
        actualLength: pixels.length,
        width,
        height,
      },
    );
  }

  return ok(undefined);
}
