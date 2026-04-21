const GRAYSCALE_MATRIX = [
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0, 0, 0, 1, 0,
] as const;

const PRESET_COLOR_MATRICES: Record<string, readonly number[]> = {
  'cinematic-01': [
    1.08, 0.02, -0.03, 0, -0.02,
    0.0, 1.0, 0.08, 0, -0.01,
    0.06, 0.02, 0.92, 0, 0.03,
    0, 0, 0, 1, 0,
  ],
  'portrait-01': [
    1.03, 0.01, 0.01, 0, 0.03,
    0.01, 1.01, 0.01, 0, 0.03,
    0.02, 0.01, 1.0, 0, 0.02,
    0, 0, 0, 1, 0,
  ],
  'vintage-01': [
    1.2, 0.1, 0, 0, 0.05,
    0.1, 1.1, 0, 0, 0.02,
    0, 0.1, 0.9, 0, -0.02,
    0, 0, 0, 1, 0,
  ],
  'moody-01': [
    1.1, 0, 0, 0, -0.05,
    0, 1.1, 0, 0, -0.05,
    0, 0, 1.1, 0, -0.05,
    0, 0, 0, 1, 0,
  ],
  'bw-01': GRAYSCALE_MATRIX,
};

export function getPresetColorMatrix(presetId: string): readonly number[] | null {
  return PRESET_COLOR_MATRICES[presetId] ?? null;
}
