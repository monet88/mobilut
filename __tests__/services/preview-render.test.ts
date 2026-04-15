import { createInitialEditState } from '../../src/core/edit-session/edit-state';
import { MAX_PREVIEW_DIMENSION } from '../../src/core/image-pipeline/pipeline-constraints';
import {
  buildPreviewRequest,
  renderPreview,
} from '../../src/services/image/preview-render.service';

describe('renderPreview', () => {
  it('returns original URI for small images', async () => {
    const request = {
      asset: {
        id: 'test',
        uri: 'file://test.jpg',
        width: 800,
        height: 600,
        format: 'jpeg' as const,
        fileSize: null,
      },
      transforms: [],
      targetWidth: 800,
      targetHeight: 600,
      pixelRatio: 1,
      maxDimension: MAX_PREVIEW_DIMENSION,
    };

    const result = await renderPreview(request);

    expect(result.uri).toBe('file://test.jpg');
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it('scales down large images to maxDimension', async () => {
    const request = {
      asset: {
        id: 'test',
        uri: 'file://large.jpg',
        width: 4000,
        height: 3000,
        format: 'jpeg' as const,
        fileSize: null,
      },
      transforms: [],
      targetWidth: 4000,
      targetHeight: 3000,
      pixelRatio: 1,
      maxDimension: 1080,
    };

    const result = await renderPreview(request);

    expect(result.width).toBeLessThanOrEqual(1080);
    expect(result.height).toBeLessThanOrEqual(1080);
  });

  it('buildPreviewRequest creates correct request from EditState', () => {
    const state = createInitialEditState('asset-1', 'file://photo.jpg', 1920, 1080);
    const request = buildPreviewRequest(state) as {
      readonly asset: { readonly id: string; readonly uri: string };
      readonly maxDimension: number;
    };

    expect(request.asset.id).toBe('asset-1');
    expect(request.asset.uri).toBe('file://photo.jpg');
    expect(request.maxDimension).toBe(MAX_PREVIEW_DIMENSION);
  });
});
