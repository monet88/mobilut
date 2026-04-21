import { DEFAULT_SMART_FILTER, computeSmartFilterCorrection } from '@core/stylistic/smart-filter-model';
import { isSmartFilterActive } from '@core/render/smart-filter-transform';

describe('smart-filter-model', () => {
  it('exposes the default smart filter state', () => {
    expect(DEFAULT_SMART_FILTER).toEqual({ enabled: false, strength: 0.5 });
  });

  it('computes correction adjustments for underexposed images', () => {
    expect(
      computeSmartFilterCorrection(
        {
          avgBrightness: 0.2,
          avgContrast: 0.4,
          avgSaturation: 0.3,
          isUnderexposed: true,
          isOverexposed: false,
          isLowContrast: true,
          isFlatColors: true,
        },
        0.5,
      ),
    ).toEqual({
      exposureAdjust: 0.15,
      contrastAdjust: 0.075,
      saturationAdjust: 0.05,
      highlightsAdjust: 0,
      shadowsAdjust: 0.1,
    });
  });

  it('computes correction adjustments for overexposed images', () => {
    expect(
      computeSmartFilterCorrection(
        {
          avgBrightness: 0.9,
          avgContrast: 0.7,
          avgSaturation: 0.8,
          isUnderexposed: false,
          isOverexposed: true,
          isLowContrast: false,
          isFlatColors: false,
        },
        1,
      ),
    ).toEqual({
      exposureAdjust: -0.2,
      contrastAdjust: 0,
      saturationAdjust: 0,
      highlightsAdjust: -0.3,
      shadowsAdjust: 0,
    });
  });

  it('keeps neutral corrections when no flags are set', () => {
    expect(
      computeSmartFilterCorrection(
        {
          avgBrightness: 0.5,
          avgContrast: 0.5,
          avgSaturation: 0.5,
          isUnderexposed: false,
          isOverexposed: false,
          isLowContrast: false,
          isFlatColors: false,
        },
        0.25,
      ),
    ).toEqual({
      exposureAdjust: 0,
      contrastAdjust: 0,
      saturationAdjust: 0,
      highlightsAdjust: 0,
      shadowsAdjust: 0,
    });
  });
});

describe('isSmartFilterActive', () => {
  it('returns false for null, disabled, and zero strength', () => {
    expect(isSmartFilterActive(null)).toBe(false);
    expect(isSmartFilterActive({ enabled: false, strength: 0.5 })).toBe(false);
    expect(isSmartFilterActive({ enabled: true, strength: 0 })).toBe(false);
  });

  it('returns true for enabled filters with positive strength', () => {
    expect(isSmartFilterActive({ enabled: true, strength: 0.1 })).toBe(true);
    expect(isSmartFilterActive({ enabled: true, strength: 1 })).toBe(true);
  });

  it('treats negative strength as inactive', () => {
    expect(isSmartFilterActive({ enabled: true, strength: -1 })).toBe(false);
  });
});
