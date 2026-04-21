export interface SmartFilterParams {
  readonly enabled: boolean;
  readonly strength: number; // 0.1 – 1.0
}

export interface ImageAnalysis {
  readonly avgBrightness: number; // 0–1
  readonly avgContrast: number; // 0–1
  readonly avgSaturation: number; // 0–1
  readonly isUnderexposed: boolean;
  readonly isOverexposed: boolean;
  readonly isLowContrast: boolean;
  readonly isFlatColors: boolean;
}

export interface SmartFilterCorrection {
  readonly exposureAdjust: number;
  readonly contrastAdjust: number;
  readonly saturationAdjust: number;
  readonly highlightsAdjust: number;
  readonly shadowsAdjust: number;
}

export function computeSmartFilterCorrection(
  analysis: ImageAnalysis,
  strength: number,
): SmartFilterCorrection {
  let exposureAdjust = 0;
  let contrastAdjust = 0;
  let saturationAdjust = 0;
  let highlightsAdjust = 0;
  let shadowsAdjust = 0;

  if (analysis.isUnderexposed) {
    exposureAdjust = 0.3 * strength;
    shadowsAdjust = 0.2 * strength;
  }
  if (analysis.isOverexposed) {
    exposureAdjust = -0.2 * strength;
    highlightsAdjust = -0.3 * strength;
  }
  if (analysis.isLowContrast) {
    contrastAdjust = 0.15 * strength;
  }
  if (analysis.isFlatColors) {
    saturationAdjust = 0.1 * strength;
  }

  return { exposureAdjust, contrastAdjust, saturationAdjust, highlightsAdjust, shadowsAdjust };
}

export const DEFAULT_SMART_FILTER: SmartFilterParams = { enabled: false, strength: 0.5 };
