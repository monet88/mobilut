import {
  DEFAULT_PRO_CLARITY,
  clampProClarityParams,
  hasProClarityApplied,
} from '@core/stylistic/pro-clarity-model';
import { isProClarityActive } from '@core/render/pro-clarity-transform';

describe('pro-clarity-model', () => {
  it('exposes the frozen default pro clarity params', () => {
    expect(DEFAULT_PRO_CLARITY).toEqual({
      clarity: 0,
      sharpness: 0,
      structure: 0,
      microContrast: 0,
    });
  });

  it('detects when pro clarity is applied', () => {
    expect(hasProClarityApplied(DEFAULT_PRO_CLARITY)).toBe(false);
    expect(hasProClarityApplied({ clarity: 0.1, sharpness: 0, structure: 0, microContrast: 0 })).toBe(true);
    expect(hasProClarityApplied({ clarity: 0, sharpness: -0.1, structure: 0, microContrast: 0 })).toBe(true);
  });

  it('clamps partial params into the valid range', () => {
    expect(
      clampProClarityParams({
        clarity: -1.5,
        sharpness: 0.5,
        structure: 2,
        microContrast: undefined,
      }),
    ).toEqual({
      clarity: -1,
      sharpness: 0.5,
      structure: 1,
      microContrast: 0,
    });
  });

  it('defaults missing values to zero', () => {
    expect(clampProClarityParams({})).toEqual(DEFAULT_PRO_CLARITY);
  });
});

describe('isProClarityActive', () => {
  it('returns false for null and neutral params', () => {
    expect(isProClarityActive(null)).toBe(false);
    expect(isProClarityActive(DEFAULT_PRO_CLARITY)).toBe(false);
  });

  it('returns true when any field is non-zero', () => {
    expect(isProClarityActive({ clarity: 0, sharpness: 0, structure: 0, microContrast: 0.01 })).toBe(true);
  });

  it('treats out-of-range values as active when non-zero', () => {
    expect(isProClarityActive({ clarity: -1, sharpness: 0, structure: 0, microContrast: 0 })).toBe(true);
  });
});
