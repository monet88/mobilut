import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockExportToGallery = jest.fn(async () => null);
const mockExportAndShare = jest.fn(async () => null);

jest.mock('../../src/features/export-image/use-export-image', () => ({
  useExportImage: () => ({
    isExporting: false,
    error: null,
    exportToGallery: mockExportToGallery,
    exportAndShare: mockExportAndShare,
  }),
}));

const { ExportImageScreen } = require('../../src/features/export-image/export-image.screen');

describe('ExportImageScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lets the user choose PNG before saving or sharing', () => {
    const editState = {
      assetId: 'asset-1',
      assetUri: 'file:///photo.jpg',
      assetWidth: 1200,
      assetHeight: 900,
      selectedPresetId: null,
      customLutTable: null,
      adjustments: {
        intensity: 1,
        temperature: 0,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        sharpen: 0,
      },
      rotation: 0 as const,
      crop: null,
      regionMask: null,
      framing: null,
      watermark: null,
    };

    const screen = render(<ExportImageScreen editState={editState} />);

    fireEvent.press(screen.getByText('PNG'));
    fireEvent.press(screen.getByText('Save to Gallery'));

    expect(mockExportToGallery).toHaveBeenCalledWith(editState, 'png');
  });
});
