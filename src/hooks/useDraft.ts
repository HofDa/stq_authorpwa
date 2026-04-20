import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';
import { getDraft, saveDraft } from '@/storage';
import type { TourDraft } from '@/schema';

/**
 * Returns a live draft by id plus an updater that persists partial changes.
 *
 * `update` accepts either a partial patch or a recipe function. It always
 * bumps `updatedAt` via `saveDraft`.
 */
export function useDraft(draftId: string | undefined) {
  const draft = useLiveQuery(
    async () => (draftId ? await getDraft(draftId) : undefined),
    [draftId],
  );

  const update = useCallback(
    async (patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft)) => {
      if (!draftId) return;
      const current = await getDraft(draftId);
      if (!current) return;
      const next =
        typeof patch === 'function' ? patch(current) : { ...current, ...patch };
      await saveDraft(next);
    },
    [draftId],
  );

  return { draft, update } as const;
}
