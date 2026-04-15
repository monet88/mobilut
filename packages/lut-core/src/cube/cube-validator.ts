import { LutMetadata, LutTable, ParseResult, err, ok } from '../model';

export interface CubeDocument {
  readonly table: LutTable;
  readonly metadata: LutMetadata;
}

const MIN_CUBE_SIZE = 2;
const MAX_CUBE_SIZE = 65;

export function validateCube(document: CubeDocument): ParseResult<void> {
  const { table, metadata } = document;

  if (!Number.isInteger(table.size) || table.size < MIN_CUBE_SIZE || table.size > MAX_CUBE_SIZE) {
    return err('CUBE_SIZE_OUT_OF_RANGE', 'Cube LUT size must be between 2 and 65.', {
      size: table.size,
    });
  }

  const expectedLength = table.size * table.size * table.size * 3;
  if (table.data.length !== expectedLength) {
    return err('CUBE_INVALID_DATA_LENGTH', 'Cube LUT data length does not match LUT size.', {
      expectedLength,
      actualLength: table.data.length,
      size: table.size,
    });
  }

  for (let index = 0; index < table.data.length; index += 1) {
    const value = table.data[index];
    if (!Number.isFinite(value)) {
      return err('CUBE_INVALID_DATA_VALUE', 'Cube LUT data contains a non-finite number.', {
        index,
        value,
      });
    }
  }

  for (let channelIndex = 0; channelIndex < 3; channelIndex += 1) {
    if (metadata.domainMin[channelIndex] >= metadata.domainMax[channelIndex]) {
      return err(
        'CUBE_INVALID_DOMAIN',
        'Cube LUT domain min must be lower than domain max for every channel.',
        {
          channelIndex,
          domainMin: metadata.domainMin,
          domainMax: metadata.domainMax,
        },
      );
    }
  }

  return ok(undefined);
}
