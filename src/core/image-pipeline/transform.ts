import {
  AdjustmentParams,
  CropParams,
  FramingParams,
  RegionMask,
  WatermarkParams,
} from '../edit-session/edit-state';

export type Transform =
  | { readonly type: 'lut'; readonly presetId: string }
  | { readonly type: 'custom-lut'; readonly lutId: string }
  | { readonly type: 'adjust'; readonly params: AdjustmentParams }
  | { readonly type: 'rotate'; readonly degrees: 0 | 90 | 180 | 270 }
  | { readonly type: 'crop'; readonly params: CropParams }
  | { readonly type: 'region-mask'; readonly mask: RegionMask }
  | { readonly type: 'framing'; readonly params: FramingParams }
  | { readonly type: 'watermark'; readonly params: WatermarkParams };
