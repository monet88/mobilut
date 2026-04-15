import { parseCube, serializeCube } from '@lut-core/cube';
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

function makeMinimalCubeText(size: number): string {
  const lut = makeIdentityLut(size);
  const lines = ['TITLE "Identity"', `LUT_3D_SIZE ${size}`, 'DOMAIN_MIN 0 0 0', 'DOMAIN_MAX 1 1 1'];

  for (let index = 0; index < lut.data.length; index += 3) {
    lines.push(`${lut.data[index]} ${lut.data[index + 1]} ${lut.data[index + 2]}`);
  }

  return lines.join('\n');
}

describe('serializeCube', () => {
  it('round-trips parse -> serialize -> parse with same values', () => {
    const parsed = parseCube(makeMinimalCubeText(2));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const serialized = serializeCube(parsed.value.table, parsed.value.metadata);
    const reparsed = parseCube(serialized);

    expect(reparsed.ok).toBe(true);
    if (!reparsed.ok) {
      return;
    }

    expect(reparsed.value.metadata.title).toBe(parsed.value.metadata.title);
    expect(Array.from(reparsed.value.table.data)).toEqual(Array.from(parsed.value.table.data));
  });

  it('contains TITLE, LUT_3D_SIZE, DOMAIN_MIN, and DOMAIN_MAX', () => {
    const serialized = serializeCube(makeIdentityLut(2), {
      title: 'Identity',
      size: 2,
      domainMin: [0, 0, 0],
      domainMax: [1, 1, 1],
      comments: [],
    });

    expect(serialized).toContain('TITLE "Identity"');
    expect(serialized).toContain('LUT_3D_SIZE 2');
    expect(serialized).toContain('DOMAIN_MIN 0.000000 0.000000 0.000000');
    expect(serialized).toContain('DOMAIN_MAX 1.000000 1.000000 1.000000');
  });

  it('formats data rows with six decimal places', () => {
    const serialized = serializeCube(makeIdentityLut(2), {
      title: 'Identity',
      size: 2,
      domainMin: [0, 0, 0],
      domainMax: [1, 1, 1],
      comments: [],
    });

    expect(serialized).toMatch(/0\.000000 0\.000000 0\.000000/);
    expect(serialized).toMatch(/1\.000000 1\.000000 1\.000000/);
  });
});
