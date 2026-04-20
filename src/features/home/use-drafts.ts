import { useCallback, useEffect, useState } from 'react';

import type { DraftSummary } from '@core/draft';
import { deleteDraft, listDrafts } from '@services/storage';

function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

export function useDrafts() {
  const [drafts, setDrafts] = useState<readonly DraftSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDrafts(await listDrafts());
    } catch (err) {
      setError(toError(err));
    } finally {
      setIsLoading(false);
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
