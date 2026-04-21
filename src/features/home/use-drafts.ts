import { useCallback, useEffect, useRef, useState } from 'react';

import type { DraftSummary } from '@core/draft';
import { deleteDraft, listDrafts } from '@services/storage';

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

export function useDrafts() {
  const [drafts, setDrafts] = useState<readonly DraftSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const refreshRequestIdRef = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = refreshRequestIdRef.current + 1;
    refreshRequestIdRef.current = requestId;
    setIsLoading(true);
    setError(null);
    try {
      const nextDrafts = await listDrafts();
      if (refreshRequestIdRef.current === requestId) {
        setDrafts(nextDrafts);
      }
    } catch (err) {
      if (refreshRequestIdRef.current === requestId) {
        setError(toError(err));
      }
    } finally {
      if (refreshRequestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  const remove = useCallback(async (assetId: string) => {
    setError(null);
    try {
      await deleteDraft(assetId);
      setDrafts((current) => current.filter((draft) => draft.assetId !== assetId));
    } catch (err) {
      setError(toError(err));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { drafts, isLoading, error, refresh, remove };
}
