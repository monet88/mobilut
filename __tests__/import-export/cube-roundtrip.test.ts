import { parseCube } from '../../packages/lut-core/src/cube/cube-parser';
import { serializeCube } from '../../packages/lut-core/src/cube/cube-serializer';
import { createLutTable } from '../../packages/lut-core/src/model/lut-table';
import {
  DEFAULT_DOMAIN_MAX,
  DEFAULT_DOMAIN_MIN,
} from '../../packages/lut-core/src/model/lut-metadata';

describe('.cube import/export round-trip', () => {
  it('parse → serialize → parse produces identical LUT', () => {
    const size = 2;
    const table = createLutTable(size);

    for (let b = 0; b < size; b += 1) {
      for (let g = 0; g < size; g += 1) {
        for (let r = 0; r < size; r += 1) {
          const index = (b * size * size + g * size + r) * 3;
          table.data[index] = r / (size - 1);
          table.data[index + 1] = g / (size - 1);
          table.data[index + 2] = b / (size - 1);
        }
      }
    }

    const metadata = {
      title: 'Test LUT',
      size,
      domainMin: DEFAULT_DOMAIN_MIN,
      domainMax: DEFAULT_DOMAIN_MAX,
      comments: [],
    };

    const cubeText = serializeCube(table, metadata);
    const result = parseCube(cubeText);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.table.size).toBe(size);

    for (let index = 0; index < table.data.length; index += 1) {
      expect(result.value.table.data[index]).toBeCloseTo(table.data[index], 5);
    }
  });

  it('serialized .cube contains required keywords', () => {
    const size = 2;
    const table = createLutTable(size);
    const metadata = {
      title: 'My LUT',
      size,
      domainMin: DEFAULT_DOMAIN_MIN,
      domainMax: DEFAULT_DOMAIN_MAX,
      comments: [],
    };

    const cubeText = serializeCube(table, metadata);

    expect(cubeText).toContain('LUT_3D_SIZE');
    expect(cubeText).toContain('DOMAIN_MIN');
    expect(cubeText).toContain('DOMAIN_MAX');
    expect(cubeText).toContain('TITLE');
  });

  it('parse fails gracefully for malformed .cube', () => {
    const result = parseCube('this is not a cube file');

    expect(result.ok).toBe(false);
  });
});
