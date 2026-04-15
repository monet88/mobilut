import {
  DEFAULT_DOMAIN_MAX,
  DEFAULT_DOMAIN_MIN,
  LutMetadata,
  LutTable,
  ParseResult,
  createLutTable,
  err,
  ok,
} from '../model';
import { CubeDocument, validateCube } from './cube-validator';

function parseVector(rawValue: string, keyword: string): ParseResult<[number, number, number]> {
  const parts = rawValue.trim().split(/\s+/);
  if (parts.length !== 3) {
    return err('CUBE_INVALID_VECTOR', `${keyword} must contain exactly three numeric values.`, {
      keyword,
      rawValue,
    });
  }

  const values = parts.map((part) => Number.parseFloat(part));
  if (values.some((value) => Number.isNaN(value) || !Number.isFinite(value))) {
    return err('CUBE_INVALID_NUMBER', `${keyword} contains an invalid numeric value.`, {
      keyword,
      rawValue,
    });
  }

  return ok([values[0], values[1], values[2]]);
}

function parseTitle(rawValue: string): string {
  const trimmed = rawValue.trim();
  const quoted = trimmed.match(/^"(.*)"$/);
  return quoted ? quoted[1] : trimmed;
}

export function parseCube(text: string): ParseResult<CubeDocument> {
  const lines = text.split(/\r?\n/);

  let size: number | null = null;
  let title = '';
  let domainMin: readonly [number, number, number] = DEFAULT_DOMAIN_MIN;
  let domainMax: readonly [number, number, number] = DEFAULT_DOMAIN_MAX;
  const comments: string[] = [];
  const values: number[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith('#')) {
      comments.push(trimmed.slice(1).trim());
      continue;
    }

    const keywordMatch = trimmed.match(/^(TITLE|LUT_3D_SIZE|DOMAIN_MIN|DOMAIN_MAX)\s+(.*)$/);
    if (keywordMatch) {
      const [, keyword, rawValue] = keywordMatch;

      if (keyword === 'TITLE') {
        title = parseTitle(rawValue);
        continue;
      }

      if (keyword === 'LUT_3D_SIZE') {
        const parsedSize = Number.parseInt(rawValue.trim(), 10);
        if (!Number.isInteger(parsedSize)) {
          return err('CUBE_INVALID_SIZE', 'LUT_3D_SIZE must be an integer.', {
            rawValue,
            line: lineIndex + 1,
          });
        }

        size = parsedSize;
        continue;
      }

      if (keyword === 'DOMAIN_MIN' || keyword === 'DOMAIN_MAX') {
        const parsedVector = parseVector(rawValue, keyword);
        if (!parsedVector.ok) {
          return parsedVector;
        }

        if (keyword === 'DOMAIN_MIN') {
          domainMin = parsedVector.value;
        } else {
          domainMax = parsedVector.value;
        }

        continue;
      }
    }

    const parsedRow = parseVector(trimmed, 'DATA_ROW');
    if (!parsedRow.ok) {
      return parsedRow;
    }

    for (const value of parsedRow.value) {
      if (value < 0 || value > 1) {
        return err('CUBE_VALUE_OUT_OF_RANGE', 'Cube LUT values must be in the 0..1 range.', {
          line: lineIndex + 1,
          value,
        });
      }

      values.push(value);
    }
  }

  if (size === null) {
    return err('CUBE_MISSING_SIZE', 'Cube LUT is missing LUT_3D_SIZE.');
  }

  const expectedLength = size * size * size * 3;
  if (values.length !== expectedLength) {
    return err('CUBE_INVALID_DATA_COUNT', 'Cube LUT data row count does not match LUT size.', {
      size,
      expectedTriplets: expectedLength / 3,
      actualTriplets: values.length / 3,
    });
  }

  const table = createLutTable(size);
  table.data.set(values);

  const metadata: LutMetadata = {
    title,
    size,
    domainMin,
    domainMax,
    comments,
  };

  const validationResult = validateCube({ table, metadata });
  if (!validationResult.ok) {
    return validationResult;
  }

  return ok({ table, metadata });
}
