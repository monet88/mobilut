import { useCallback } from 'react';

import type { EditAction } from '@core/edit-session/edit-action';
import type { FramingParams } from '@core/edit-session/edit-state';

export function useFraming(dispatch: (action: EditAction) => void) {
  const setFraming = useCallback(
    (framing: FramingParams) => {
      dispatch({ type: 'SET_FRAMING', framing });
    },
    [dispatch],
  );

  const clearFraming = useCallback(() => {
    dispatch({ type: 'CLEAR_FRAMING' });
  }, [dispatch]);

  return { setFraming, clearFraming };
}
