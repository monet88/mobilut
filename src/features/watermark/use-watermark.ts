import { useCallback } from 'react';

import type { EditAction } from '@core/edit-session/edit-action';
import type { WatermarkParams } from '@core/edit-session/edit-state';

export function useWatermark(dispatch: (action: EditAction) => void) {
  const setWatermark = useCallback(
    (watermark: WatermarkParams) => {
      dispatch({ type: 'SET_WATERMARK', watermark });
    },
    [dispatch],
  );

  const clearWatermark = useCallback(() => {
    dispatch({ type: 'CLEAR_WATERMARK' });
  }, [dispatch]);

  return { setWatermark, clearWatermark };
}
