import { LutTable } from '@lut-core/model';

import type { BlendParams } from '../blend/blend-model';
import type { ArtisticLookParams } from '../stylistic/artistic-look-model';
import type { SmartFilterParams } from '../stylistic/smart-filter-model';
import type { ProClarityParams } from '../stylistic/pro-clarity-model';

export interface CropParams {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: string | null;
}

export interface AdjustmentParams {
  readonly intensity: number;
  readonly temperature: number;
  readonly brightness: number;
  readonly contrast: number;
  readonly saturation: number;
  readonly sharpen: number;
}

export interface FramingParams {
  readonly borderWidth: number;
  readonly borderColor: string;
  readonly borderRadius: number;
  readonly tapeStyle: string | null;
}

export interface RegionMask {
  readonly type: 'rect' | 'ellipse';
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly feather: number;
  readonly inverted: boolean;
}

export interface WatermarkParams {
  readonly enabled: boolean;
  readonly cameraLogoId: string | null;
  readonly showExif: boolean;
  readonly position: 'bottom-left' | 'bottom-right' | 'bottom-center';
}

export interface EditState {
  readonly assetId: string;
  readonly assetUri: string;
  readonly assetWidth: number;
  readonly assetHeight: number;
  readonly selectedPresetId: string | null;
  readonly customLutTable: LutTable | null;
  readonly adjustments: AdjustmentParams;
  readonly rotation: 0 | 90 | 180 | 270;
  readonly crop: CropParams | null;
  readonly regionMask: RegionMask | null;
  readonly framing: FramingParams | null;
  readonly watermark: WatermarkParams | null;
  readonly artisticLook: ArtisticLookParams | null;
  readonly smartFilter: SmartFilterParams | null;
  readonly proClarity: ProClarityParams | null;
  readonly blend: BlendParams | null;
}

export const DEFAULT_ADJUSTMENTS: AdjustmentParams = Object.freeze({
  intensity: 1,
  temperature: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpen: 0,
});

export function createInitialEditState(
  assetId: string,
  assetUri: string,
  assetWidth: number,
  assetHeight: number,
): EditState {
  return Object.freeze({
    assetId,
    assetUri,
    assetWidth,
    assetHeight,
    selectedPresetId: null,
    customLutTable: null,
    adjustments: DEFAULT_ADJUSTMENTS,
    rotation: 0,
    crop: null,
    regionMask: null,
    framing: null,
    watermark: null,
    artisticLook: null,
    smartFilter: null,
    proClarity: null,
    blend: null,
  });
}
