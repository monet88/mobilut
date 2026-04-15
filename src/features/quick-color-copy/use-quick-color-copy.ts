import { useCallback, useState } from 'react';

import { createLutTable, type LutTable } from '@lut-core/model/lut-table';
import { applyLut } from '@lut-core/interpolate/trilinear';

import { computeStats, reinhardTransfer } from './reinhard-transfer';

export function useQuickColorCopy() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [generatedLut, setGeneratedLut] = useState<LutTable | null>(null);

  const generateFromImages = useCallback(
    async (sourcePixels: Float32Array, targetPixels: Float32Array) => {
      setIsProcessing(true);
      setError(null);
      try {
        const sourceStats = computeStats(sourcePixels);
        const targetStats = computeStats(targetPixels);
        const size = 17;
        const lut = createLutTable(size);

        for (let b = 0; b < size; b += 1) {
          for (let g = 0; g < size; g += 1) {
            for (let r = 0; r < size; r += 1) {
              const rNorm = r / (size - 1);
              const gNorm = g / (size - 1);
              const bNorm = b / (size - 1);

              const input = new Float32Array([rNorm, gNorm, bNorm]);
              const transferred = reinhardTransfer(input, sourceStats, targetStats);
              const polished = applyLut(transferred[0], transferred[1], transferred[2], lut);
              const idx = (b * size * size + g * size + r) * 3;

              lut.data[idx] = polished[0] || transferred[0];
              lut.data[idx + 1] = polished[1] || transferred[1];
              lut.data[idx + 2] = polished[2] || transferred[2];
            }
          }
        }

        setGeneratedLut(lut);
        return lut;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return { isProcessing, error, generatedLut, generateFromImages };
}
