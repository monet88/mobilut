/**
 * Reinhard color transfer algorithm.
 * Transfers the color statistics from a source image to a target image.
 * Works in Lab color space for perceptually uniform transfer.
 *
 * Reference: Reinhard et al. "Color Transfer between Images" (2001)
 */

interface ColorStats {
  readonly meanL: number;
  readonly meanA: number;
  readonly meanB: number;
  readonly stdL: number;
  readonly stdA: number;
  readonly stdB: number;
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const a = (r - g) * 0.5;
  const bLab = (r + g - 2 * b) * 0.25;
  return [l, a, bLab];
}

function labToRgb(l: number, a: number, b: number): [number, number, number] {
  const r = Math.max(0, Math.min(1, l + a + b * 0.5));
  const g = Math.max(0, Math.min(1, l - a + b * 0.5));
  const bRgb = Math.max(0, Math.min(1, l - b));
  return [r, g, bRgb];
}

function computeStats(pixels: Float32Array): ColorStats {
  let sumL = 0;
  let sumA = 0;
  let sumB = 0;
  const count = pixels.length / 3;

  for (let i = 0; i < pixels.length; i += 3) {
    const [l, a, b] = rgbToLab(pixels[i], pixels[i + 1], pixels[i + 2]);
    sumL += l;
    sumA += a;
    sumB += b;
  }

  const meanL = sumL / count;
  const meanA = sumA / count;
  const meanB = sumB / count;

  let varL = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < pixels.length; i += 3) {
    const [l, a, b] = rgbToLab(pixels[i], pixels[i + 1], pixels[i + 2]);
    varL += (l - meanL) ** 2;
    varA += (a - meanA) ** 2;
    varB += (b - meanB) ** 2;
  }

  return {
    meanL,
    meanA,
    meanB,
    stdL: Math.sqrt(varL / count),
    stdA: Math.sqrt(varA / count),
    stdB: Math.sqrt(varB / count),
  };
}

export function reinhardTransfer(
  targetPixels: Float32Array,
  sourceStats: ColorStats,
  targetStats: ColorStats,
): Float32Array {
  const result = new Float32Array(targetPixels.length);

  for (let i = 0; i < targetPixels.length; i += 3) {
    const [l, a, b] = rgbToLab(targetPixels[i], targetPixels[i + 1], targetPixels[i + 2]);
    const newL =
      (l - targetStats.meanL) * (sourceStats.stdL / (targetStats.stdL || 1)) + sourceStats.meanL;
    const newA =
      (a - targetStats.meanA) * (sourceStats.stdA / (targetStats.stdA || 1)) + sourceStats.meanA;
    const newB =
      (b - targetStats.meanB) * (sourceStats.stdB / (targetStats.stdB || 1)) + sourceStats.meanB;

    const [r, g, bRgb] = labToRgb(newL, newA, newB);
    result[i] = r;
    result[i + 1] = g;
    result[i + 2] = bRgb;
  }

  return result;
}

export { computeStats };
export type { ColorStats };
