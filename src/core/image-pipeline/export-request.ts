import { ImageAsset } from './image-asset';
import { Transform } from './transform';

export type ExportFormat = 'jpeg' | 'png' | 'webp';

export interface ExportRequest {
  readonly asset: ImageAsset;
  readonly transforms: readonly Transform[];
  readonly format: ExportFormat;
  readonly quality: number;
  readonly targetWidth: number;
  readonly targetHeight: number;
  readonly includeMetadata: boolean;
}
