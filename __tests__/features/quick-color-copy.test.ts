import { renderHook, act } from '@testing-library/react-native';

import { computeStats, reinhardTransfer } from '@features/quick-color-copy/reinhard-transfer';
import { useQuickColorCopy } from '@features/quick-color-copy/use-quick-color-copy';

describe('quick color copy', () => {
  it('computes channel statistics for rgb pixels', () => {
    const stats = computeStats(new Float32Array([1, 0, 0, 0, 1, 0]));

    expect(stats.meanL).toBeGreaterThan(0);
    expect(stats.stdA).toBeGreaterThanOrEqual(0);
    expect(stats.stdB).toBeGreaterThanOrEqual(0);
  });

  it('transfers target pixels toward source statistics', () => {
    const source = computeStats(new Float32Array([0.9, 0.8, 0.7, 0.8, 0.7, 0.6]));
    const target = computeStats(new Float32Array([0.2, 0.3, 0.4, 0.3, 0.4, 0.5]));

    const result = reinhardTransfer(new Float32Array([0.25, 0.35, 0.45]), source, target);

    expect(result).toHaveLength(3);
    expect(result[0]).toBeGreaterThan(0.25);
    expect(result[1]).toBeGreaterThan(0.35);
    expect(result[2]).toBeGreaterThan(0.45);
  });

  it('generates a 17x17x17 lut from two images', async () => {
    const { result } = renderHook(() => useQuickColorCopy());

    let lut = null;

    await act(async () => {
      lut = await result.current.generateFromImages(
        new Float32Array([0.9, 0.8, 0.7, 0.8, 0.7, 0.6]),
        new Float32Array([0.2, 0.3, 0.4, 0.3, 0.4, 0.5]),
      );
    });

    expect(lut).not.toBeNull();
    expect(lut?.size).toBe(17);
    expect(lut?.data.length).toBe(17 * 17 * 17 * 3);
  });
});
