import { LutTable, lutTableIndex } from '../model';

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function samplePoint(x: number, y: number, z: number, lut: LutTable): [number, number, number] {
  const offset = lutTableIndex(x, y, z, lut.size);
  return [lut.data[offset], lut.data[offset + 1], lut.data[offset + 2]];
}

export function applyLut(r: number, g: number, b: number, lut: LutTable): [number, number, number] {
  const maxIndex = lut.size - 1;
  const redPosition = clampUnit(r) * maxIndex;
  const greenPosition = clampUnit(g) * maxIndex;
  const bluePosition = clampUnit(b) * maxIndex;

  const redFloor = Math.floor(redPosition);
  const greenFloor = Math.floor(greenPosition);
  const blueFloor = Math.floor(bluePosition);
  const redCeil = Math.min(maxIndex, Math.ceil(redPosition));
  const greenCeil = Math.min(maxIndex, Math.ceil(greenPosition));
  const blueCeil = Math.min(maxIndex, Math.ceil(bluePosition));

  const redFraction = redPosition - redFloor;
  const greenFraction = greenPosition - greenFloor;
  const blueFraction = bluePosition - blueFloor;

  const c000 = samplePoint(redFloor, greenFloor, blueFloor, lut);
  const c100 = samplePoint(redCeil, greenFloor, blueFloor, lut);
  const c010 = samplePoint(redFloor, greenCeil, blueFloor, lut);
  const c110 = samplePoint(redCeil, greenCeil, blueFloor, lut);
  const c001 = samplePoint(redFloor, greenFloor, blueCeil, lut);
  const c101 = samplePoint(redCeil, greenFloor, blueCeil, lut);
  const c011 = samplePoint(redFloor, greenCeil, blueCeil, lut);
  const c111 = samplePoint(redCeil, greenCeil, blueCeil, lut);

  const output: [number, number, number] = [0, 0, 0];
  for (let channelIndex = 0; channelIndex < 3; channelIndex += 1) {
    const c00 = lerp(c000[channelIndex], c100[channelIndex], redFraction);
    const c10 = lerp(c010[channelIndex], c110[channelIndex], redFraction);
    const c01 = lerp(c001[channelIndex], c101[channelIndex], redFraction);
    const c11 = lerp(c011[channelIndex], c111[channelIndex], redFraction);
    const c0 = lerp(c00, c10, greenFraction);
    const c1 = lerp(c01, c11, greenFraction);
    output[channelIndex] = lerp(c0, c1, blueFraction);
  }

  return output;
}
