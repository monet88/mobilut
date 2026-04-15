import { LutTable, ParseResult, createLutTable, err, ok } from '../model';
import { validateHald } from './hald-validator';

function normalizeByte(value: number): number {
  return value / 255;
}

export function parseHald(
  pixels: Uint8Array,
  width: number,
  height: number,
): ParseResult<LutTable> {
  const validationResult = validateHald(pixels, width, height);
  if (!validationResult.ok) {
    return validationResult;
  }

  const size = Math.round(Math.cbrt(width));
  const table = createLutTable(size);
  const entryCount = size * size * size;

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    const pixelOffset = entryIndex * width * 4;
    if (pixelOffset + 3 >= pixels.length) {
      return err(
        'HALD_INVALID_LAYOUT',
        'Hald image layout ended before all LUT entries were read.',
        {
          entryIndex,
          pixelOffset,
        },
      );
    }

    const tableOffset = entryIndex * 3;
    table.data[tableOffset] = normalizeByte(pixels[pixelOffset]);
    table.data[tableOffset + 1] = normalizeByte(pixels[pixelOffset + 1]);
    table.data[tableOffset + 2] = normalizeByte(pixels[pixelOffset + 2]);
  }

  return ok(table);
}
