export const ERROR_MESSAGE_KEYS = {
  import: {
    fileTooLarge: 'errors.import.fileTooLarge',
    unsupportedFormat: 'errors.import.unsupportedFormat',
    permissionDenied: 'errors.import.permissionDenied',
    invalidImage: 'errors.import.invalidImage',
    transparentPng: 'errors.import.transparentPng',
  },
  export: {
    writeFailed: 'errors.export.writeFailed',
    permissionDenied: 'errors.export.permissionDenied',
    dimensionTooLarge: 'errors.export.dimensionTooLarge',
    outOfMemory: 'errors.export.outOfMemory',
  },
  lut: {
    parseFailed: 'errors.lut.parseFailed',
    unsupportedSize: 'errors.lut.unsupportedSize',
    invalidHald: 'errors.lut.invalidHald',
    importFailed: 'errors.lut.importFailed',
  },
  render: {
    shaderFailed: 'errors.render.shaderFailed',
    outOfMemory: 'errors.render.outOfMemory',
    exportFailed: 'errors.render.exportFailed',
  },
} as const;
