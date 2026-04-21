import * as ImageManipulator from 'expo-image-manipulator';

export interface ResizeOptions {
  readonly maxWidth: number;
  readonly maxHeight?: number;
  readonly quality?: number;
  readonly format?: ImageFormat;
}

export type ImageFormat = 'jpeg' | 'png';

function getCompressValue(quality: number | undefined): number {
  if (typeof quality !== 'number' || Number.isNaN(quality)) {
    return 1;
  }

  return Math.min(1, Math.max(0, quality));
}

function getSaveFormat(format: ImageFormat | undefined): ImageManipulator.SaveFormat {
  return format === 'png'
    ? ImageManipulator.SaveFormat.PNG
    : ImageManipulator.SaveFormat.JPEG;
}

export async function resizeImage(uri: string, options: ResizeOptions): Promise<string> {
  const resize =
    typeof options.maxHeight === 'number'
      ? {
          width: options.maxWidth,
          height: options.maxHeight,
        }
      : {
          width: options.maxWidth,
        };

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        resize,
      },
    ],
    {
      compress: getCompressValue(options.quality),
      format: getSaveFormat(options.format),
    },
  );

  return result.uri;
}

interface SaveImageOptions {
  readonly quality?: number;
  readonly format?: ImageFormat;
}

export async function rotateImage(
  uri: string,
  degrees: 90 | 180 | 270,
  options: SaveImageOptions = {},
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ rotate: degrees }], {
    compress: getCompressValue(options.quality),
    format: getSaveFormat(options.format),
  });

  return result.uri;
}

export async function cropImage(
  uri: string,
  originX: number,
  originY: number,
  width: number,
  height: number,
  options: SaveImageOptions = {},
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        crop: {
          originX,
          originY,
          width,
          height,
        },
      },
    ],
    {
      compress: getCompressValue(options.quality),
      format: getSaveFormat(options.format),
    },
  );

  return result.uri;
}

export async function saveImage(uri: string, options: SaveImageOptions = {}): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: getCompressValue(options.quality),
    format: getSaveFormat(options.format),
  });

  return result.uri;
}
