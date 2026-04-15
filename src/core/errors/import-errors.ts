export class ImportImageError extends Error {
  readonly code: string;
  readonly userMessageKey: string;

  constructor(code: string, message: string, userMessageKey: string) {
    super(message);
    this.name = 'ImportImageError';
    this.code = code;
    this.userMessageKey = userMessageKey;
  }
}

export const ImportErrors = {
  FILE_TOO_LARGE: (fileSize: number) =>
    new ImportImageError(
      'IMPORT_FILE_TOO_LARGE',
      `File size ${fileSize} exceeds limit`,
      'errors.import.fileTooLarge',
    ),
  UNSUPPORTED_FORMAT: (format: string) =>
    new ImportImageError(
      'IMPORT_UNSUPPORTED_FORMAT',
      `Format ${format} is not supported`,
      'errors.import.unsupportedFormat',
    ),
  PERMISSION_DENIED: () =>
    new ImportImageError(
      'IMPORT_PERMISSION_DENIED',
      'Photo library permission denied',
      'errors.import.permissionDenied',
    ),
  INVALID_IMAGE: (reason: string) =>
    new ImportImageError(
      'IMPORT_INVALID_IMAGE',
      `Invalid image: ${reason}`,
      'errors.import.invalidImage',
    ),
  TRANSPARENT_PNG: () =>
    new ImportImageError(
      'IMPORT_TRANSPARENT_PNG',
      'Transparent PNG import is not supported for this pipeline',
      'errors.import.transparentPng',
    ),
} as const;
