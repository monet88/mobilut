import { ImageAsset } from './image-asset';
import { Transform } from './transform';

export interface PreviewRequest {
  readonly asset: ImageAsset;
  readonly transforms: readonly Transform[];
  readonly targetWidth: number;
  readonly targetHeight: number;
  readonly pixelRatio: number;
}
