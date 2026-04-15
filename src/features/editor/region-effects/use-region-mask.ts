import { useCallback } from 'react';

import type { EditAction } from '@core/edit-session/edit-action';
import type { RegionMask } from '@core/edit-session/edit-state';

export function useRegionMask(dispatch: (action: EditAction) => void) {
  const setMask = useCallback(
    (mask: RegionMask) => {
      dispatch({ type: 'SET_REGION_MASK', mask });
    },
    [dispatch],
  );

  const clearMask = useCallback(() => {
    dispatch({ type: 'CLEAR_REGION_MASK' });
  }, [dispatch]);

  return { setMask, clearMask };
}
