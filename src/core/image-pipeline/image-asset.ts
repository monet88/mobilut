export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'heic' | 'unknown';

export interface ImageAsset {
  readonly id: string;
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  readonly format: ImageFormat;
  readonly fileSize: number | null;
}
