import { LutTable } from '@lut-core/model';

import {
  AdjustmentParams,
  CropParams,
  FramingParams,
  RegionMask,
  WatermarkParams,
} from './edit-state';

export type EditAction =
  | { readonly type: 'SELECT_PRESET'; readonly presetId: string }
  | { readonly type: 'CLEAR_PRESET' }
  | { readonly type: 'SET_CUSTOM_LUT'; readonly lut: LutTable }
  | { readonly type: 'CLEAR_CUSTOM_LUT' }
  | { readonly type: 'SET_ADJUSTMENTS'; readonly adjustments: Partial<AdjustmentParams> }
  | { readonly type: 'RESET_ADJUSTMENTS' }
  | { readonly type: 'SET_ROTATION'; readonly rotation: 0 | 90 | 180 | 270 }
  | { readonly type: 'ROTATE_CW' }
  | { readonly type: 'ROTATE_CCW' }
  | { readonly type: 'SET_CROP'; readonly crop: CropParams }
  | { readonly type: 'CLEAR_CROP' }
  | { readonly type: 'SET_REGION_MASK'; readonly mask: RegionMask }
  | { readonly type: 'CLEAR_REGION_MASK' }
  | { readonly type: 'SET_FRAMING'; readonly framing: FramingParams }
  | { readonly type: 'CLEAR_FRAMING' }
  | { readonly type: 'SET_WATERMARK'; readonly watermark: WatermarkParams }
  | { readonly type: 'CLEAR_WATERMARK' };
