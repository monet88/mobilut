export interface ExifData {
  readonly make: string | null;
  readonly model: string | null;
  readonly focalLength: number | null;
  readonly aperture: number | null;
  readonly shutterSpeed: string | null;
  readonly iso: number | null;
  readonly dateTime: string | null;
  readonly gpsLatitude: number | null;
  readonly gpsLongitude: number | null;
}

const EMPTY_EXIF_DATA: ExifData = {
  make: null,
  model: null,
  focalLength: null,
  aperture: null,
  shutterSpeed: null,
  iso: null,
  dateTime: null,
  gpsLatitude: null,
  gpsLongitude: null,
};

function getNumberValue(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

export function extractExifData(rawExif: Record<string, unknown> | null | undefined): ExifData {
  if (!rawExif) {
    return EMPTY_EXIF_DATA;
  }

  const isoValue = rawExif.ISOSpeedRatings;
  const iso =
    typeof isoValue === 'number'
      ? isoValue
      : Array.isArray(isoValue) && typeof isoValue[0] === 'number'
        ? isoValue[0]
        : null;

  return {
    make: typeof rawExif.Make === 'string' ? rawExif.Make : null,
    model: typeof rawExif.Model === 'string' ? rawExif.Model : null,
    focalLength: getNumberValue(rawExif.FocalLength),
    aperture: getNumberValue(rawExif.FNumber),
    shutterSpeed: typeof rawExif.ExposureTime === 'string' ? rawExif.ExposureTime : null,
    iso,
    dateTime: typeof rawExif.DateTime === 'string' ? rawExif.DateTime : null,
    gpsLatitude: getNumberValue(rawExif.GPSLatitude),
    gpsLongitude: getNumberValue(rawExif.GPSLongitude),
  };
}

export function formatCameraModel(exif: ExifData): string | null {
  if (!exif.make && !exif.model) {
    return null;
  }

  if (!exif.make) {
    return exif.model;
  }

  if (!exif.model) {
    return exif.make;
  }

  if (exif.model.startsWith(exif.make)) {
    return exif.model;
  }

  return `${exif.make} ${exif.model}`;
}
