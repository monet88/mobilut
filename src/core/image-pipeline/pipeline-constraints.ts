export const MAX_PREVIEW_DIMENSION = 1080;
export const MAX_EXPORT_DIMENSION = 8192;
export const MAX_IMPORT_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_EXPORT_PIXELS = 8192 * 8192;
export const MEMORY_BUDGET_BYTES = 256 * 1024 * 1024;
export const SUPPORTED_IMPORT_FORMATS: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];
