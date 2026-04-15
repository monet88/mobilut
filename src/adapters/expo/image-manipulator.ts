import * as ImageManipulator from 'expo-image-manipulator';

export interface ResizeOptions {
  readonly maxWidth: number;
  readonly maxHeight: number;
  readonly quality?: number;
}

function getCompressValue(quality: number | undefined): number {
  if (typeof quality !== 'number' || Number.isNaN(quality)) {
    return 1;
  }

  return Math.min(1, Math.max(0, quality));
}

export async function resizeImage(uri: string, options: ResizeOptions): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        resize: {
          width: options.maxWidth,
          height: options.maxHeight,
        },
      },
    ],
    {
      compress: getCompressValue(options.quality),
    },
  );

  return result.uri;
}

export async function rotateImage(uri: string, degrees: 90 | 180 | 270): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ rotate: degrees }]);

  return result.uri;
}

export async function cropImage(
  uri: string,
  originX: number,
  originY: number,
  width: number,
  height: number,
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [
    {
      crop: {
        originX,
        originY,
        width,
        height,
      },
    },
  ]);

  return result.uri;
}
