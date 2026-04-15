export const en = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    done: 'Done',
    retry: 'Retry',
    loading: 'Loading...',
  },
  errors: {
    import: {
      fileTooLarge: 'File is too large. Maximum size is 50MB.',
      unsupportedFormat: 'This file format is not supported.',
      permissionDenied: 'Photo library access was denied. Please enable it in Settings.',
      invalidImage: 'This image could not be opened.',
      transparentPng: 'Transparent PNG images may not display correctly.',
    },
    export: {
      writeFailed: 'Could not save the image. Please try again.',
      permissionDenied: 'Storage access was denied. Please enable it in Settings.',
      dimensionTooLarge: 'Image is too large to export.',
      outOfMemory: 'Not enough memory to export this image.',
    },
    lut: {
      parseFailed: 'Could not read this LUT file.',
      unsupportedSize: 'This LUT size is not supported.',
      invalidHald: 'This HaldCLUT file is not valid.',
      importFailed: 'Could not import this LUT.',
    },
    render: {
      shaderFailed: 'Rendering failed. Please try again.',
      outOfMemory: 'Not enough memory to render.',
      exportFailed: 'Export failed. Please try again.',
    },
  },
  editor: {
    title: 'Editor',
    undo: 'Undo',
    redo: 'Redo',
    export: 'Export',
    compare: 'Compare',
    presets: 'Presets',
    adjustments: 'Adjustments',
    crop: 'Crop',
    rotate: 'Rotate',
    framing: 'Framing',
    watermark: 'Watermark',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    exportQuality: 'Export Quality',
    watermark: 'Watermark',
  },
} as const;
