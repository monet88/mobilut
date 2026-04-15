export class LutProcessingError extends Error {
  readonly code: string;
  readonly userMessageKey: string;

  constructor(code: string, message: string, userMessageKey: string) {
    super(message);
    this.name = 'LutProcessingError';
    this.code = code;
    this.userMessageKey = userMessageKey;
  }
}

export const LutErrors = {
  PARSE_FAILED: (reason: string) =>
    new LutProcessingError(
      'LUT_PARSE_FAILED',
      `Failed to parse LUT: ${reason}`,
      'errors.lut.parseFailed',
    ),
  UNSUPPORTED_SIZE: (size: number) =>
    new LutProcessingError(
      'LUT_UNSUPPORTED_SIZE',
      `LUT size ${size} is not supported`,
      'errors.lut.unsupportedSize',
    ),
  INVALID_HALD: (reason: string) =>
    new LutProcessingError(
      'LUT_INVALID_HALD',
      `Invalid Hald image: ${reason}`,
      'errors.lut.invalidHald',
    ),
  IMPORT_FAILED: (reason: string) =>
    new LutProcessingError(
      'LUT_IMPORT_FAILED',
      `LUT import failed: ${reason}`,
      'errors.lut.importFailed',
    ),
} as const;
