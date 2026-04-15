import { validateCube } from '@lut-core/cube';
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

describe('validateCube', () => {
  it('passes for a valid LUT', () => {
    const result = validateCube({
      table: makeIdentityLut(2),
      metadata: {
        title: 'Identity',
        size: 2,
        domainMin: [0, 0, 0],
        domainMax: [1, 1, 1],
        comments: [],
      },
    });

    expect(result.ok).toBe(true);
  });

  it('fails when size is below range', () => {
    const result = validateCube({
      table: { size: 0, data: new Float32Array() },
      metadata: {
        title: 'Broken',
        size: 0,
        domainMin: [0, 0, 0],
        domainMax: [1, 1, 1],
        comments: [],
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CUBE_SIZE_OUT_OF_RANGE');
    }
  });

  it('fails when size is above range', () => {
    const result = validateCube({
      table: { size: 66, data: new Float32Array(66 * 66 * 66 * 3) },
      metadata: {
        title: 'Broken',
        size: 66,
        domainMin: [0, 0, 0],
        domainMax: [1, 1, 1],
        comments: [],
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CUBE_SIZE_OUT_OF_RANGE');
    }
  });

  it('fails when data length does not match size', () => {
    const result = validateCube({
      table: { size: 2, data: new Float32Array(3) },
      metadata: {
        title: 'Broken',
        size: 2,
        domainMin: [0, 0, 0],
        domainMax: [1, 1, 1],
        comments: [],
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CUBE_INVALID_DATA_LENGTH');
    }
  });

  it('fails when data contains NaN', () => {
    const lut = makeIdentityLut(2);
    lut.data[4] = Number.NaN;

    const result = validateCube({
      table: lut,
      metadata: {
        title: 'Broken',
        size: 2,
        domainMin: [0, 0, 0],
        domainMax: [1, 1, 1],
        comments: [],
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CUBE_INVALID_DATA_VALUE');
    }
  });
});
