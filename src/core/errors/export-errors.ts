export class ExportImageError extends Error {
  readonly code: string;
  readonly userMessageKey: string;

  constructor(code: string, message: string, userMessageKey: string) {
    super(message);
    this.name = 'ExportImageError';
    this.code = code;
    this.userMessageKey = userMessageKey;
  }
}

export const ExportErrors = {
  WRITE_FAILED: (reason: string) =>
    new ExportImageError(
      'EXPORT_WRITE_FAILED',
      `Failed to write exported file: ${reason}`,
      'errors.export.writeFailed',
    ),
  PERMISSION_DENIED: () =>
    new ExportImageError(
      'EXPORT_PERMISSION_DENIED',
      'Media library permission denied during export',
      'errors.export.permissionDenied',
    ),
  DIMENSION_TOO_LARGE: (width: number, height: number) =>
    new ExportImageError(
      'EXPORT_DIMENSION_TOO_LARGE',
      `Export dimensions ${width}x${height} exceed supported limits`,
      'errors.export.dimensionTooLarge',
    ),
  OUT_OF_MEMORY: (bytesRequired: number) =>
    new ExportImageError(
      'EXPORT_OUT_OF_MEMORY',
      `Export requires ${bytesRequired} bytes which exceeds the memory budget`,
      'errors.export.outOfMemory',
    ),
} as const;
