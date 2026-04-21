import { act, renderHook } from '@testing-library/react-native';

const mockRenderExport = jest.fn();
const mockSaveImageToGallery = jest.fn(async () => undefined);
const mockShareFile = jest.fn(async () => undefined);

jest.mock('@services/image/export-render.service', () => ({
  renderExport: (...args: unknown[]) => mockRenderExport(...args),
}));

jest.mock('@adapters/expo/media-library', () => ({
  saveImageToGallery: (...args: unknown[]) => mockSaveImageToGallery(...args),
}));

jest.mock('@adapters/expo/sharing', () => ({
  shareFile: (...args: unknown[]) => mockShareFile(...args),
}));

const { useExportImage } = require('@features/export-image/use-export-image');

describe('useExportImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes the selected PNG format through render and share', async () => {
    mockRenderExport.mockResolvedValue({
      uri: 'file:///export.png',
      width: 1200,
      height: 900,
      format: 'png',
    });

    const { result } = renderHook(() => useExportImage());

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

    await act(async () => {
      await result.current.exportAndShare(editState, 'png');
    });

    expect(mockRenderExport).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'png',
        outputFormat: 'png',
      }),
    );
    expect(mockShareFile).toHaveBeenCalledWith('file:///export.png', 'image/png');
  });
});
